import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import pool from "../db.js";
import { authenticate, createToken } from "../middleware/auth.js";
import { getPolicies, validatePassword, checkPasswordHistory, storePasswordHistory } from "../utils/password.js";
import { logEvent } from "../utils/logger.js";
import { sendOtpEmail, isEmailConfigured } from "../utils/email.js";

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || "kims-dashboard-jwt-secret-change-in-production";

function generateOtp(length = 6) {
  return Array.from({ length }, () => crypto.randomInt(0, 10)).join("");
}

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const { username, password, site } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }

  try {
    const result = await pool.query(
      `SELECT u.*, r.name AS role_name, r.label AS role_label,
              r.landing_path, r.allowed_paths, r.active AS role_active
       FROM users u
       JOIN roles r ON r.id = u.role_id
       WHERE u.username = $1`,
      [username.trim()]
    );

    const user = result.rows[0];

    if (!user) {
      logEvent("warning", `Failed login attempt for unknown username "${username.trim()}"`, req);
      return res.status(401).json({ error: "Invalid username or password" });
    }

    if (!user.active) {
      return res.status(401).json({ error: "This user is inactive" });
    }

    if (!user.role_active) {
      return res.status(401).json({ error: "This user's role is inactive" });
    }

    const allowed = user.allowed_sites || [];
    if (site && !allowed.includes(site)) {
      return res.status(401).json({ error: "This user is not configured for the selected site" });
    }

    const policies = await getPolicies();

    // Lockout check (skip for superadmin)
    if (user.role_name !== "superadmin" && user.locked_until && new Date(user.locked_until) > new Date()) {
      const mins = Math.ceil((new Date(user.locked_until) - new Date()) / 60000);
      return res.status(423).json({ error: `Account locked. Try again in ${mins} minute(s).` });
    }

    const match = await bcrypt.compare(password, user.password_hash);

    if (!match) {
      // Track failed attempts (skip for superadmin)
      if (user.role_name !== "superadmin") {
        const newFailed = (user.failed_attempts || 0) + 1;
        if (newFailed >= policies.max_failed_attempts) {
          const lockedUntil = new Date(Date.now() + policies.lockout_minutes * 60000);
          await pool.query(
            "UPDATE users SET failed_attempts = $1, locked_until = $2 WHERE id = $3",
            [newFailed, lockedUntil, user.id]
          );
          return res.status(423).json({ error: `Account locked for ${policies.lockout_minutes} minutes due to too many failed attempts.` });
        }
        await pool.query("UPDATE users SET failed_attempts = $1 WHERE id = $2", [newFailed, user.id]);
      }
      logEvent("warning", `Failed login attempt for user "${user.username}" (wrong password)`, req);
      return res.status(401).json({ error: "Invalid username or password" });
    }

    // Success — reset failed attempts
    await pool.query("UPDATE users SET failed_attempts = 0, locked_until = NULL WHERE id = $1", [user.id]);

    logEvent("info", `User "${user.username}" logged in from site "${site || allowed[0]}"`, req, user);

    // Check password expiry (skip for superadmin)
    if (user.role_name !== "superadmin" && policies.expiry_days > 0) {
      const lastChanged = user.password_changed_at || user.created_at;
      const expiryDate = new Date(lastChanged);
      expiryDate.setDate(expiryDate.getDate() + policies.expiry_days);
      if (new Date() > expiryDate) {
        const tempToken = createToken({ ...user, site: site || allowed[0] });
        return res.status(200).json({
          token: tempToken,
          passwordExpired: true,
          message: "Your password has expired. Please change it.",
          user: {
            id: user.id,
            username: user.username,
            name: user.name,
            role: user.role_name,
            roleLabel: user.role_label,
            site: site || allowed[0],
            email: user.email,
            phone: user.phone,
            empId: user.emp_id,
            allowedSites: allowed,
            landingPath: user.landing_path,
            allowedPaths: user.allowed_paths,
            forcePasswordChange: true,
            avatarUrl: user.avatar_url,
            privacyAcceptedAt: user.privacy_accepted_at,
          },
        });
      }
    }

    if (user.force_password_change) {
      const tempToken = createToken({ ...user, site: site || allowed[0] });
      return res.status(200).json({
        token: tempToken,
        passwordExpired: true,
        message: "Please change your password before continuing.",
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role_name,
        roleLabel: user.role_label,
        site: site || allowed[0],
        email: user.email,
        phone: user.phone,
        empId: user.emp_id,
        allowedSites: allowed,
        landingPath: user.landing_path,
        allowedPaths: user.allowed_paths,
        forcePasswordChange: true,
        avatarUrl: user.avatar_url,
        privacyAcceptedAt: user.privacy_accepted_at,
      },
    });
  }

    // If user has email and email is configured, require OTP before full login
    if (user.email && isEmailConfigured()) {
      const code = generateOtp();
      await pool.query(
        "INSERT INTO login_otps (user_id, code, expires_at) VALUES ($1, $2, NOW() + INTERVAL '10 minutes')",
        [user.id, code]
      );
      await sendOtpEmail(user.email, code);
      logEvent("info", `OTP sent to user "${user.username}" at ${user.email}`, req, user);

      const otpToken = jwt.sign(
        { id: user.id, username: user.username, role: user.role_name, site: site || allowed[0], scope: "otp" },
        JWT_SECRET,
        { expiresIn: "10m" }
      );

      return res.json({
        otpRequired: true,
        otpToken,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          role: user.role_name,
          roleLabel: user.role_label,
          site: site || allowed[0],
          email: user.email,
          phone: user.phone,
          empId: user.emp_id,
          allowedSites: allowed,
          landingPath: user.landing_path,
          allowedPaths: user.allowed_paths,
          avatarUrl: user.avatar_url,
          privacyAcceptedAt: user.privacy_accepted_at,
        },
      });
    }

    const token = createToken(user);

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role_name,
        roleLabel: user.role_label,
        site: site || allowed[0],
        email: user.email,
        phone: user.phone,
        empId: user.emp_id,
        allowedSites: allowed,
        landingPath: user.landing_path,
        allowedPaths: user.allowed_paths,
        avatarUrl: user.avatar_url,
        privacyAcceptedAt: user.privacy_accepted_at,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/auth/verify-otp
router.post("/verify-otp", async (req, res) => {
  const { otpToken, code } = req.body;

  if (!otpToken || !code) {
    return res.status(400).json({ error: "OTP token and code are required" });
  }

  try {
    let payload;
    try {
      payload = jwt.verify(otpToken, JWT_SECRET);
    } catch {
      return res.status(401).json({ error: "OTP session expired. Please login again." });
    }

    if (payload.scope !== "otp") {
      return res.status(401).json({ error: "Invalid token scope" });
    }

    const result = await pool.query(
      `SELECT l.*, u.username, u.name, u.role_id, u.email, u.phone, u.emp_id,
              u.allowed_sites, u.avatar_url, u.privacy_accepted_at,
              r.name AS role_name, r.label AS role_label,
              r.landing_path, r.allowed_paths
       FROM login_otps l
       JOIN users u ON u.id = l.user_id
       JOIN roles r ON r.id = u.role_id
       WHERE l.user_id = $1 AND l.code = $2 AND l.used = false AND l.expires_at > NOW()
       ORDER BY l.created_at DESC LIMIT 1`,
      [payload.id, code]
    );

    const row = result.rows[0];
    if (!row) {
      logEvent("warning", `Invalid/expired OTP attempt for user "${payload.username}"`, req);
      return res.status(401).json({ error: "Invalid or expired OTP code" });
    }

    await pool.query("UPDATE login_otps SET used = true WHERE id = $1", [row.id]);

    logEvent("info", `User "${row.username}" verified OTP and logged in`, req, row);

    const token = createToken(row);
    const allowed = row.allowed_sites || [];

    res.json({
      token,
      user: {
        id: row.id,
        username: row.username,
        name: row.name,
        role: row.role_name,
        roleLabel: row.role_label,
        site: payload.site || allowed[0],
        email: row.email,
        phone: row.phone,
        empId: row.emp_id,
        allowedSites: allowed,
        landingPath: row.landing_path,
        allowedPaths: row.allowed_paths,
        avatarUrl: row.avatar_url,
        privacyAcceptedAt: row.privacy_accepted_at,
      },
    });
  } catch (err) {
    console.error("Verify OTP error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/auth/me
router.get("/me", authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.username, u.name, u.email, u.phone, u.emp_id,
              u.allowed_sites, u.active, u.force_password_change,
              u.avatar_url, u.privacy_accepted_at,
              r.name AS role_name, r.label AS role_label,
              r.landing_path, r.allowed_paths, r.active AS role_active
       FROM users u
       JOIN roles r ON r.id = u.role_id
       WHERE u.id = $1`,
      [req.user.id]
    );

    const user = result.rows[0];
    if (!user || !user.active || !user.role_active) {
      return res.status(401).json({ error: "User or role is no longer active" });
    }

    res.json({
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role_name,
        roleLabel: user.role_label,
        site: req.user.site,
        email: user.email,
        phone: user.phone,
        empId: user.emp_id,
        allowedSites: user.allowed_sites,
        landingPath: user.landing_path,
        allowedPaths: user.allowed_paths,
        forcePasswordChange: user.force_password_change,
        avatarUrl: user.avatar_url,
        privacyAcceptedAt: user.privacy_accepted_at,
      },
    });
  } catch (err) {
    console.error("Auth me error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/auth/avatar
router.put("/avatar", authenticate, async (req, res) => {
  const { avatarUrl } = req.body;

  if (typeof avatarUrl !== "string" || avatarUrl.length > 3000000) {
    return res.status(400).json({ error: "Invalid avatar URL" });
  }

  try {
    await pool.query("UPDATE users SET avatar_url = $1, updated_at = NOW() WHERE id = $2", [avatarUrl, req.user.id]);
    res.json({ avatarUrl });
  } catch (err) {
    console.error("Avatar update error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/auth/profile
router.put("/profile", authenticate, async (req, res) => {
  const { name, email, phone } = req.body;

  try {
    await pool.query(
      `UPDATE users SET
         name = COALESCE($1, name),
         email = COALESCE($2, email),
         phone = COALESCE($3, phone),
         updated_at = NOW()
       WHERE id = $4`,
      [
        name || null,
        email !== undefined ? email : null,
        phone !== undefined ? phone : null,
        req.user.id,
      ]
    );

    const result = await pool.query(
      `SELECT u.id, u.username, u.name, u.email, u.phone, u.emp_id,
              u.allowed_sites, u.force_password_change,
              u.avatar_url, u.privacy_accepted_at,
              r.name AS role_name, r.label AS role_label,
              r.landing_path, r.allowed_paths
       FROM users u
       JOIN roles r ON r.id = u.role_id
       WHERE u.id = $1`,
      [req.user.id]
    );

    const user = result.rows[0];

    res.json({
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        phone: user.phone,
        empId: user.emp_id,
        allowedSites: user.allowed_sites,
        site: req.user.site,
        role: user.role_name,
        roleLabel: user.role_label,
        landingPath: user.landing_path,
        allowedPaths: user.allowed_paths,
        avatarUrl: user.avatar_url,
        privacyAcceptedAt: user.privacy_accepted_at,
        forcePasswordChange: user.force_password_change,
      },
    });
  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/auth/privacy-accept
router.put("/privacy-accept", authenticate, async (req, res) => {
  try {
    await pool.query("UPDATE users SET privacy_accepted_at = NOW() WHERE id = $1", [req.user.id]);
    res.json({ accepted: true });
  } catch (err) {
    console.error("Privacy accept error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/auth/change-password
router.put("/change-password", authenticate, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: "Current password and new password are required" });
  }

  try {
    const result = await pool.query(
      "SELECT u.id, u.password_hash, r.name AS role_name FROM users u JOIN roles r ON r.id = u.role_id WHERE u.id = $1",
      [req.user.id]
    );
    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const match = await bcrypt.compare(currentPassword, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    const policies = await getPolicies();
    const validationErrors = validatePassword(newPassword, policies, currentPassword);
    if (validationErrors.length > 0) {
      return res.status(400).json({ error: validationErrors.join(". ") });
    }

    const historyErrors = await checkPasswordHistory(user.id, newPassword, policies.history_count);
    if (historyErrors.length > 0) {
      return res.status(400).json({ error: historyErrors.join(". ") });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Store old password in history
    await storePasswordHistory(user.id, user.password_hash);

    await pool.query(
      "UPDATE users SET password_hash = $1, updated_at = NOW(), password_changed_at = NOW(), force_password_change = false WHERE id = $2",
      [passwordHash, user.id]
    );

    // Generate fresh token
    const token = createToken({ ...req.user, ...user });

    logEvent("info", `User "${req.user.username}" changed their password`, req);

    res.json({ message: "Password changed successfully", token });
  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
