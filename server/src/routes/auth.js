import { Router } from "express";
import bcrypt from "bcrypt";
import pool from "../db.js";
import { authenticate, createToken, getUserRoles, mergeRolePermissions } from "../middleware/auth.js";
import { getPolicies, validatePassword, checkPasswordHistory, storePasswordHistory } from "../utils/password.js";
import { logEvent } from "../utils/logger.js";

const router = Router();

async function buildUserResponse(userRow, rolesData, site) {
  const allowed = userRow.allowed_sites || [];
  const roleNames = rolesData.map(r => r.name);
  const roleLabels = rolesData.map(r => r.label);
  const merged = mergeRolePermissions(rolesData);
  const isSuper = roleNames.includes("superadmin");
  return {
    id: userRow.id,
    username: userRow.username,
    name: userRow.name,
    roles: roleNames,
    role: roleNames[0] || "",
    roleLabel: roleLabels[0] || "",
    site: site || allowed[0] || "",
    email: userRow.email,
    phone: userRow.phone,
    empId: userRow.emp_id,
    allowedSites: allowed,
    landingPath: merged.landingPath,
    allowedPaths: merged.allowedPaths,
    avatarUrl: userRow.avatar_url,
    privacyAcceptedAt: userRow.privacy_accepted_at,
  };
}

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const { username, password, site } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }

  try {
    const result = await pool.query(
      `SELECT u.* FROM users u WHERE LOWER(u.username) = LOWER($1)`,
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

    const rolesData = await getUserRoles(user.id);
    if (rolesData.length === 0) {
      return res.status(401).json({ error: "This user has no active roles assigned" });
    }

    const roleNames = rolesData.map(r => r.name);
    const isSuper = roleNames.includes("superadmin");

    const allowed = user.allowed_sites || [];
    if (site && !allowed.includes(site)) {
      return res.status(401).json({ error: "This user is not configured for the selected site" });
    }

    const policies = await getPolicies();

    // Lockout check (skip superadmin)
    if (!isSuper && user.locked_until && new Date(user.locked_until) > new Date()) {
      const mins = Math.ceil((new Date(user.locked_until) - new Date()) / 60000);
      return res.status(423).json({ error: `Account locked. Try again in ${mins} minute(s).` });
    }

    const match = await bcrypt.compare(password, user.password_hash);

    if (!match) {
      if (!isSuper) {
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

    // Password expiry (skip superadmin)
    if (!isSuper && policies.expiry_days > 0) {
      const lastChanged = user.password_changed_at || user.created_at;
      const expiryDate = new Date(lastChanged);
      expiryDate.setDate(expiryDate.getDate() + policies.expiry_days);
      if (new Date() > expiryDate) {
        const userResp = await buildUserResponse(user, rolesData, site || allowed[0]);
        const tempToken = createToken({ ...userResp, roles: roleNames, role_name: roleNames[0], site: site || allowed[0] });
        return res.json({ token: tempToken, passwordExpired: true, message: "Your password has expired. Please change it.", user: { ...userResp, forcePasswordChange: true } });
      }
    }

    if (user.force_password_change) {
      const userResp = await buildUserResponse(user, rolesData, site || allowed[0]);
      const tempToken = createToken({ ...userResp, roles: roleNames, role_name: roleNames[0], site: site || allowed[0] });
      return res.json({ token: tempToken, passwordExpired: true, message: "Please change your password before continuing.", user: { ...userResp, forcePasswordChange: true } });
    }

    const userResp = await buildUserResponse(user, rolesData, site || allowed[0]);
    const token = createToken({ ...userResp, roles: roleNames, role_name: roleNames[0], site: site || allowed[0] });

    res.json({ token, user: userResp });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/auth/me
router.get("/me", authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.username, u.name, u.email, u.phone, u.emp_id,
              u.allowed_sites, u.active, u.force_password_change,
              u.avatar_url, u.privacy_accepted_at
       FROM users u WHERE u.id = $1`,
      [req.user.id]
    );

    const user = result.rows[0];
    if (!user || !user.active) {
      return res.status(401).json({ error: "User is no longer active" });
    }

    const rolesData = await getUserRoles(user.id);
    if (rolesData.length === 0) {
      return res.status(401).json({ error: "User has no active roles" });
    }

    const userResp = await buildUserResponse(user, rolesData, req.user.site);
    res.json({ user: { ...userResp, forcePasswordChange: user.force_password_change } });
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
              u.avatar_url, u.privacy_accepted_at
       FROM users u WHERE u.id = $1`,
      [req.user.id]
    );

    const user = result.rows[0];
    const rolesData = await getUserRoles(user.id);
    const userResp = await buildUserResponse(user, rolesData, req.user.site);

    res.json({ user: { ...userResp, forcePasswordChange: user.force_password_change } });
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

// PUT /api/auth/select-site
router.put("/select-site", authenticate, async (req, res) => {
  const { site } = req.body;
  if (!site) return res.status(400).json({ error: "Site is required" });

  try {
    const result = await pool.query(
      "SELECT allowed_sites FROM users WHERE id = $1",
      [req.user.id]
    );
    const allowedSites = result.rows[0]?.allowed_sites || [];
    if (!allowedSites.includes(site)) {
      return res.status(403).json({ error: "You do not have access to this site" });
    }

    const userRoles = req.user.roles || [req.user.role];
    const token = createToken({ id: req.user.id, username: req.user.username, roles: userRoles, role_name: userRoles[0], site });
    logEvent("info", `User "${req.user.username}" selected site "${site}"`, req);
    res.json({ token, site });
  } catch (err) {
    console.error("Select site error:", err);
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
      "SELECT id, password_hash FROM users WHERE id = $1",
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
    const token = createToken({ ...req.user, ...user, id: user.id, username: req.user.username, roles: req.user.roles || [req.user.role], site: req.user.site });

    logEvent("info", `User "${req.user.username}" changed their password`, req);

    res.json({ message: "Password changed successfully", token });
  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
