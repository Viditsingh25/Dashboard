import { Router } from "express";
import pool from "../db.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { logEvent } from "../utils/logger.js";

const router = Router();

// GET /api/roles
router.get("/", authenticate, authorize("superadmin", "admin"), async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, label, landing_path, allowed_paths, active, created_at FROM roles WHERE deleted_at IS NULL ORDER BY id"
    );
    res.json({ roles: result.rows });
  } catch (err) {
    console.error("Get roles error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/roles
router.post("/", authenticate, authorize("superadmin"), async (req, res) => {
  const { name, label, landingPath, allowedPaths } = req.body;

  if (!name || !label) {
    return res.status(400).json({ error: "Role name and label are required" });
  }

  try {
    const existing = await pool.query("SELECT id FROM roles WHERE name = $1", [name.trim()]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "Role already exists" });
    }

    const result = await pool.query(
      `INSERT INTO roles (name, label, landing_path, allowed_paths)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, label, landing_path, allowed_paths, active, created_at`,
      [name.trim(), label.trim(), landingPath || "/", JSON.stringify(allowedPaths || ["/"])]
    );

    logEvent("info", `User "${req.user.username}" created role "${name.trim()}"`, req);
    res.status(201).json({ role: result.rows[0] });
  } catch (err) {
    console.error("Create role error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/roles/:id
router.put("/:id", authenticate, authorize("superadmin"), async (req, res) => {
  const { id } = req.params;
  const { label, landingPath, active } = req.body;

  try {
    const result = await pool.query(
      `UPDATE roles SET
        label = COALESCE($1, label),
        landing_path = COALESCE($2, landing_path),
        active = COALESCE($3, active),
        updated_at = NOW()
       WHERE id = $4
       RETURNING id, name, label, landing_path, allowed_paths, active`,
      [label || null, landingPath || null, active !== undefined ? active : null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Role not found" });
    }

    logEvent("info", `User "${req.user.username}" updated role "${result.rows[0].label}"`, req);
    res.json({ role: result.rows[0] });
  } catch (err) {
    console.error("Update role error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/roles/:id/permissions
router.put("/:id/permissions", authenticate, authorize("superadmin"), async (req, res) => {
  const { id } = req.params;
  const { allowedPaths } = req.body;

  if (!allowedPaths || !Array.isArray(allowedPaths)) {
    return res.status(400).json({ error: "allowedPaths array is required" });
  }

  try {
    const result = await pool.query(
      `UPDATE roles SET allowed_paths = $1, updated_at = NOW() WHERE id = $2
       RETURNING id, name, label, landing_path, allowed_paths, active`,
      [JSON.stringify(allowedPaths), id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Role not found" });
    }

    logEvent("info", `User "${req.user.username}" updated permissions for role "${result.rows[0].label}"`, req);
    res.json({ role: result.rows[0] });
  } catch (err) {
    console.error("Update permissions error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/roles/:id (soft delete)
router.delete("/:id", authenticate, authorize("superadmin"), async (req, res) => {
  const { id } = req.params;

  try {
    const usersCount = await pool.query(
      "SELECT COUNT(*) FROM user_roles WHERE role_id = $1",
      [id]
    );
    if (parseInt(usersCount.rows[0].count) > 0) {
      return res.status(400).json({ error: "Assign users to another role before deleting this role" });
    }

    const result = await pool.query(
      "UPDATE roles SET deleted_at = NOW(), active = false WHERE id = $1 AND name != 'superadmin' RETURNING id, name, label",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Role not found or cannot be deleted" });
    }

    logEvent("warning", `User "${req.user.username}" deleted role "${result.rows[0].label}"`, req);
    res.json({ message: "Role deleted", role: result.rows[0] });
  } catch (err) {
    console.error("Delete role error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/roles/:id/restore
router.post("/:id/restore", authenticate, authorize("superadmin"), async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "UPDATE roles SET deleted_at = NULL, active = true WHERE id = $1 AND deleted_at IS NOT NULL RETURNING id",
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Deleted role not found" });
    }
    logEvent("info", `User "${req.user.username}" restored role "${result.rows[0].id}"`, req);
    res.json({ message: "Role restored" });
  } catch (err) {
    console.error("Restore role error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
