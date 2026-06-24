import { Router } from "express";
import bcrypt from "bcrypt";
import pool from "../db.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { getPolicies, validatePassword, checkPasswordHistory, storePasswordHistory } from "../utils/password.js";
import { logEvent } from "../utils/logger.js";

const router = Router();

// GET /api/users
router.get("/", authenticate, authorize("superadmin", "admin"), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.username, u.name, u.email, u.phone, u.emp_id,
              u.allowed_sites, u.active, u.created_at, u.force_password_change,
              r.name AS role, r.label AS role_label
       FROM users u
       JOIN roles r ON r.id = u.role_id
       WHERE u.deleted_at IS NULL
       ORDER BY u.created_at DESC`
    );
    res.json({ users: result.rows });
  } catch (err) {
    console.error("Get users error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/users
router.post("/", authenticate, authorize("superadmin", "admin"), async (req, res) => {
  const { username, password, name, email, phone, empId, role, allowedSites } = req.body;

  if (!username || !password || !name || !role) {
    return res.status(400).json({ error: "Username, password, name, and role are required" });
  }

  try {
    const policies = await getPolicies();
    const validationErrors = validatePassword(password, policies);
    if (validationErrors.length > 0) {
      return res.status(400).json({ error: validationErrors.join(". ") });
    }

    const existing = await pool.query("SELECT id FROM users WHERE username = $1", [username.trim()]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "Username already exists" });
    }

    const roleResult = await pool.query("SELECT id FROM roles WHERE name = $1", [role]);
    if (roleResult.rows.length === 0) {
      return res.status(400).json({ error: "Invalid role" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (username, password_hash, name, email, phone, emp_id, role_id, allowed_sites, password_changed_at, force_password_change)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), true)
       RETURNING id, username, name, email, phone, emp_id, allowed_sites, active, created_at, force_password_change`,
      [
        username.trim(),
        passwordHash,
        name.trim(),
        email || "",
        phone || "",
        empId || "",
        roleResult.rows[0].id,
        JSON.stringify(allowedSites || ["PBMH"]),
      ]
    );

    // Don't store history for brand-new users — they haven't changed password yet
    logEvent("info", `User "${req.user.username}" created user "${result.rows[0].username}"`, req);
    res.status(201).json({ user: result.rows[0] });
  } catch (err) {
    console.error("Create user error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/users/:id
router.put("/:id", authenticate, authorize("superadmin", "admin"), async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, empId, role, allowedSites, active } = req.body;

  try {
    const existing = await pool.query(
      `SELECT u.*, r.name AS role_name FROM users u JOIN roles r ON r.id = u.role_id WHERE u.id = $1`,
      [id]
    );
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = existing.rows[0];
    if (user.role_name === "superadmin" && req.user.role !== "superadmin") {
      return res.status(403).json({ error: "Cannot modify superadmin" });
    }

    let roleId = user.role_id;
    if (role) {
      const roleResult = await pool.query("SELECT id FROM roles WHERE name = $1", [role]);
      if (roleResult.rows.length === 0) {
        return res.status(400).json({ error: "Invalid role" });
      }
      roleId = roleResult.rows[0].id;
    }

    const result = await pool.query(
      `UPDATE users SET
        name = COALESCE($1, name),
        email = COALESCE($2, email),
        phone = COALESCE($3, phone),
        emp_id = COALESCE($4, emp_id),
        role_id = $5,
        allowed_sites = $6,
        active = COALESCE($7, active),
        updated_at = NOW()
       WHERE id = $8
       RETURNING id, username, name, email, phone, emp_id, allowed_sites, active`,
      [
        name || null,
        email !== undefined ? email : null,
        phone !== undefined ? phone : null,
        empId !== undefined ? empId : null,
        roleId,
        JSON.stringify(allowedSites || user.allowed_sites),
        active !== undefined ? active : null,
        id,
      ]
    );

    logEvent("info", `User "${req.user.username}" updated user "${result.rows[0].username}"`, req);
    res.json({ user: result.rows[0] });
  } catch (err) {
    console.error("Update user error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/users/:id/reset-password
router.put("/:id/reset-password", authenticate, authorize("superadmin", "admin"), async (req, res) => {
  const { id } = req.params;
  const { password, skipValidation } = req.body;

  if (!password) {
    return res.status(400).json({ error: "Password is required" });
  }

  try {
    const existing = await pool.query(
      `SELECT u.*, r.name AS role_name FROM users u JOIN roles r ON r.id = u.role_id WHERE u.id = $1`,
      [id]
    );
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = existing.rows[0];

    if (!skipValidation) {
      const policies = await getPolicies();
      const validationErrors = validatePassword(password, policies);
      if (validationErrors.length > 0) {
        return res.status(400).json({ error: validationErrors.join(". ") });
      }

      const historyErrors = await checkPasswordHistory(user.id, password, policies.history_count);
      if (historyErrors.length > 0) {
        return res.status(400).json({ error: historyErrors.join(". ") });
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Store current password in history before overwriting
    await storePasswordHistory(user.id, user.password_hash);

    await pool.query(
      "UPDATE users SET password_hash = $1, updated_at = NOW(), password_changed_at = NOW(), failed_attempts = 0, locked_until = NULL, force_password_change = true WHERE id = $2",
      [passwordHash, id]
    );

    logEvent("warning", `User "${req.user.username}" reset password for user "${user.username}"`, req);
    res.json({ message: "Password reset successfully. User will be required to change password on next login." });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/users/:id (soft delete)
router.delete("/:id", authenticate, authorize("superadmin", "admin"), async (req, res) => {
  const { id } = req.params;

  try {
    const existing = await pool.query(
      `SELECT u.*, r.name AS role_name FROM users u JOIN roles r ON r.id = u.role_id WHERE u.id = $1 AND u.deleted_at IS NULL`,
      [id]
    );
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = existing.rows[0];
    if (user.role_name === "superadmin") {
      return res.status(403).json({ error: "Cannot delete superadmin" });
    }

    await pool.query(
      "UPDATE users SET deleted_at = NOW(), active = false, updated_at = NOW() WHERE id = $1",
      [id]
    );
    logEvent("warning", `User "${req.user.username}" deleted user "${user.username}"`, req);
    res.json({ message: "User deleted", user: { id: user.id, username: user.username, name: user.name } });
  } catch (err) {
    console.error("Delete user error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/users/:id/restore
router.post("/:id/restore", authenticate, authorize("superadmin", "admin"), async (req, res) => {
  const { id } = req.params;

  try {
    const existing = await pool.query(
      "SELECT id, username FROM users WHERE id = $1 AND deleted_at IS NOT NULL",
      [id]
    );
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: "Deleted user not found" });
    }

    await pool.query(
      "UPDATE users SET deleted_at = NULL, active = true, updated_at = NOW() WHERE id = $1",
      [id]
    );
    logEvent("info", `User "${req.user.username}" restored user "${existing.rows[0].username}"`, req);
    res.json({ message: "User restored" });
  } catch (err) {
    console.error("Restore user error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
