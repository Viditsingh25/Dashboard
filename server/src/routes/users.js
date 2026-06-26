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
              COALESCE(
                jsonb_agg(
                  jsonb_build_object('name', r.name, 'label', r.label)
                ) FILTER (WHERE r.id IS NOT NULL),
                '[]'::jsonb
              ) AS roles
       FROM users u
       LEFT JOIN user_roles ur ON ur.user_id = u.id
       LEFT JOIN roles r ON r.id = ur.role_id AND r.deleted_at IS NULL
       WHERE u.deleted_at IS NULL
       GROUP BY u.id
       ORDER BY u.created_at DESC`
    );
    const users = result.rows.map(u => ({
      ...u,
      role: u.roles?.[0]?.name || "",
      role_label: u.roles?.[0]?.label || "",
    }));
    res.json({ users });
  } catch (err) {
    console.error("Get users error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/users
router.post("/", authenticate, authorize("superadmin", "admin"), async (req, res) => {
  const { username, password, name, email, phone, empId, roles, allowedSites } = req.body;

  if (!username || !password || !name || !roles || roles.length === 0) {
    return res.status(400).json({ error: "Username, password, name, and at least one role are required" });
  }

  try {
    const policies = await getPolicies();
    const validationErrors = validatePassword(password, policies);
    if (validationErrors.length > 0) {
      return res.status(400).json({ error: validationErrors.join(". ") });
    }

    const existing = await pool.query("SELECT id FROM users WHERE LOWER(username) = LOWER($1)", [username.trim()]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "Username already exists" });
    }

    const roleResults = await pool.query(
      "SELECT id, name FROM roles WHERE name = ANY($1) AND deleted_at IS NULL",
      [roles]
    );
    if (roleResults.rows.length !== roles.length) {
      return res.status(400).json({ error: "One or more roles are invalid" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (username, password_hash, name, email, phone, emp_id, allowed_sites, password_changed_at, force_password_change)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), true)
       RETURNING id, username, name, email, phone, emp_id, allowed_sites, active, created_at, force_password_change`,
      [
        username.trim(),
        passwordHash,
        name.trim(),
        email || "",
        phone || "",
        empId || "",
        JSON.stringify(allowedSites || ["PBMH"]),
      ]
    );

    const newUser = result.rows[0];

    // Insert user_roles
    for (const r of roleResults.rows) {
      await pool.query(
        "INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
        [newUser.id, r.id]
      );
    }

    logEvent("info", `User "${req.user.username}" created user "${newUser.username}"`, req);
    res.status(201).json({ user: { ...newUser, roles: roleResults.rows.map(r => r.name) } });
  } catch (err) {
    console.error("Create user error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/users/:id
router.put("/:id", authenticate, authorize("superadmin", "admin"), async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, empId, roles, allowedSites, active } = req.body;

  try {
    const existing = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = existing.rows[0];

    // Check if target user is superadmin via user_roles
    const isSuperResult = await pool.query(
      `SELECT 1 FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = $1 AND r.name = 'superadmin'`,
      [id]
    );
    const isSuper = isSuperResult.rows.length > 0;
    const reqUserRoles = req.user.roles || [req.user.role];
    if (isSuper && !reqUserRoles.includes("superadmin")) {
      return res.status(403).json({ error: "Cannot modify superadmin" });
    }

    if (roles && roles.length > 0) {
      const roleResults = await pool.query(
        "SELECT id, name FROM roles WHERE name = ANY($1) AND deleted_at IS NULL",
        [roles]
      );
      if (roleResults.rows.length !== roles.length) {
        return res.status(400).json({ error: "One or more roles are invalid" });
      }

      // Replace all role assignments
      await pool.query("DELETE FROM user_roles WHERE user_id = $1", [id]);
      for (const r of roleResults.rows) {
        await pool.query(
          "INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
          [id, r.id]
        );
      }
    }

    const result = await pool.query(
      `UPDATE users SET
        name = COALESCE($1, name),
        email = COALESCE($2, email),
        phone = COALESCE($3, phone),
        emp_id = COALESCE($4, emp_id),
        allowed_sites = $5,
        active = COALESCE($6, active),
        updated_at = NOW()
       WHERE id = $7
       RETURNING id, username, name, email, phone, emp_id, allowed_sites, active`,
      [
        name || null,
        email !== undefined ? email : null,
        phone !== undefined ? phone : null,
        empId !== undefined ? empId : null,
        JSON.stringify(allowedSites || user.allowed_sites),
        active !== undefined ? active : null,
        id,
      ]
    );

    // Fetch updated roles
    const roleResult = await pool.query(
      `SELECT r.name, r.label FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = $1 AND r.deleted_at IS NULL`,
      [id]
    );

    logEvent("info", `User "${req.user.username}" updated user "${result.rows[0].username}"`, req);
    res.json({
      user: {
        ...result.rows[0],
        roles: roleResult.rows,
        role: roleResult.rows[0]?.name || "",
        role_label: roleResult.rows[0]?.label || "",
      },
    });
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
    const existing = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
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
    const existing = await pool.query("SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL", [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = existing.rows[0];
    const isSuperResult = await pool.query(
      `SELECT 1 FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = $1 AND r.name = 'superadmin'`,
      [id]
    );
    if (isSuperResult.rows.length > 0) {
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
