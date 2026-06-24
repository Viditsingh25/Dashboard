import { Router } from "express";
import pool from "../db.js";
import { authenticate, authorize } from "../middleware/auth.js";

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const router = Router();

router.get("/", authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, label, path, icon, sort_order, active, maintenance, coming_soon FROM modules WHERE deleted_at IS NULL ORDER BY sort_order"
    );
    res.json({ modules: result.rows });
  } catch (err) {
    console.error("Get modules error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", authenticate, authorize("superadmin", "admin"), async (req, res) => {
  const { name, label, path, icon } = req.body;
  if (!label) {
    return res.status(400).json({ error: "Label is required" });
  }
  const safeName = slugify(name || label);
  const safePath = path ? slugify(path) : `/${safeName}`;
  if (!safeName) {
    return res.status(400).json({ error: "Name could not be derived from label" });
  }
  try {
    const existing = await pool.query("SELECT id FROM modules WHERE name = $1", [safeName]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "Module already exists" });
    }
    const result = await pool.query(
      `INSERT INTO modules (name, label, path, icon) VALUES ($1, $2, $3, $4)
       RETURNING id, name, label, path, icon, sort_order, active, maintenance, coming_soon`,
      [safeName, label.trim(), safePath, icon || ""]
    );
    res.status(201).json({ module: result.rows[0] });
  } catch (err) {
    console.error("Create module error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/:id", authenticate, authorize("superadmin", "admin"), async (req, res) => {
  const { id } = req.params;
  const { name, label, path, icon, sort_order, active, maintenance, coming_soon: comingSoon } = req.body;
  const safeName = name ? slugify(name) : null;
  const safePath = path ? slugify(path) : null;
  try {
    const result = await pool.query(
      `UPDATE modules SET
        name = COALESCE($1, name),
        label = COALESCE($2, label),
        path = COALESCE($3, path),
        icon = COALESCE($4, icon),
        sort_order = COALESCE($5, sort_order),
        active = COALESCE($6, active),
        maintenance = COALESCE($7, maintenance),
        coming_soon = COALESCE($8, coming_soon),
        updated_at = NOW()
       WHERE id = $9 AND deleted_at IS NULL
       RETURNING id, name, label, path, icon, sort_order, active, maintenance, coming_soon`,
      [safeName, label || null, safePath, icon !== undefined ? icon : null, sort_order || null, active !== undefined ? active : null, maintenance !== undefined ? maintenance : null, comingSoon !== undefined ? comingSoon : null, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Module not found" });
    res.json({ module: result.rows[0] });
  } catch (err) {
    console.error("Update module error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id", authenticate, authorize("superadmin", "admin"), async (req, res) => {
  const { id } = req.params;
  try {
    const existing = await pool.query("SELECT id FROM modules WHERE id = $1 AND deleted_at IS NULL", [id]);
    if (existing.rows.length === 0) return res.status(404).json({ error: "Module not found" });
    await pool.query("UPDATE modules SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1", [id]);
    await pool.query("UPDATE kpis SET deleted_at = NOW(), updated_at = NOW() WHERE module_id = $1", [id]);
    res.json({ message: "Module deleted" });
  } catch (err) {
    console.error("Delete module error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
