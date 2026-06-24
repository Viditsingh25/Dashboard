import { Router } from "express";
import pool from "../db.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = Router();

router.get("/", authenticate, async (req, res) => {
  const { module_id } = req.query;
  try {
    let query = "SELECT id, module_id, name, label, value_type, default_value, source_column, aggregation, formula, current_value, sort_order, active FROM kpis WHERE deleted_at IS NULL";
    const params = [];
    if (module_id) {
      query += " AND module_id = $1";
      params.push(module_id);
    }
    query += " ORDER BY sort_order";
    const result = await pool.query(query, params);
    res.json({ kpis: result.rows });
  } catch (err) {
    console.error("Get KPIs error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", authenticate, authorize("superadmin", "admin"), async (req, res) => {
  const { module_id, name, label, value_type, default_value, source_column, aggregation, formula } = req.body;
  if (!module_id || !label) {
    return res.status(400).json({ error: "Module ID and label are required" });
  }
  try {
    const modCheck = await pool.query("SELECT id FROM modules WHERE id = $1 AND deleted_at IS NULL", [module_id]);
    if (modCheck.rows.length === 0) return res.status(400).json({ error: "Module not found" });
    const result = await pool.query(
      `INSERT INTO kpis (module_id, name, label, value_type, default_value, source_column, aggregation, formula)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, module_id, name, label, value_type, default_value, source_column, aggregation, formula, current_value, sort_order, active`,
      [
        module_id,
        name || label.trim().toLowerCase().replace(/\s+/g, "_"),
        label.trim(),
        value_type || "number",
        default_value || "",
        source_column || "",
        aggregation || "sum",
        formula || "",
      ]
    );
    res.status(201).json({ kpi: result.rows[0] });
  } catch (err) {
    console.error("Create KPI error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/:id", authenticate, authorize("superadmin", "admin"), async (req, res) => {
  const { id } = req.params;
  const { name, label, value_type, default_value, source_column, aggregation, formula, current_value, sort_order, active } = req.body;
  try {
    const result = await pool.query(
      `UPDATE kpis SET
        name = COALESCE($1, name),
        label = COALESCE($2, label),
        value_type = COALESCE($3, value_type),
        default_value = COALESCE($4, default_value),
        source_column = COALESCE($5, source_column),
        aggregation = COALESCE($6, aggregation),
        formula = COALESCE($7, formula),
        current_value = COALESCE($8, current_value),
        sort_order = COALESCE($9, sort_order),
        active = COALESCE($10, active),
        updated_at = NOW()
       WHERE id = $11 AND deleted_at IS NULL
       RETURNING id, module_id, name, label, value_type, default_value, source_column, aggregation, formula, current_value, sort_order, active`,
      [name || null, label || null, value_type || null, default_value !== undefined ? default_value : null, source_column !== undefined ? source_column : null, aggregation || null, formula !== undefined ? formula : null, current_value !== undefined ? current_value : null, sort_order || null, active !== undefined ? active : null, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "KPI not found" });
    res.json({ kpi: result.rows[0] });
  } catch (err) {
    console.error("Update KPI error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id", authenticate, authorize("superadmin", "admin"), async (req, res) => {
  const { id } = req.params;
  try {
    const existing = await pool.query("SELECT id FROM kpis WHERE id = $1 AND deleted_at IS NULL", [id]);
    if (existing.rows.length === 0) return res.status(404).json({ error: "KPI not found" });
    await pool.query("UPDATE kpis SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1", [id]);
    res.json({ message: "KPI deleted" });
  } catch (err) {
    console.error("Delete KPI error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/compute", authenticate, async (req, res) => {
  const { module_id, rows } = req.body;
  if (!module_id || !rows || !Array.isArray(rows)) {
    return res.status(400).json({ error: "Module ID and rows array are required" });
  }
  try {
    const kpisResult = await pool.query(
      "SELECT id, name, label, source_column, aggregation, formula, value_type, default_value FROM kpis WHERE module_id = $1 AND deleted_at IS NULL AND active = true",
      [module_id]
    );
    const updates = [];
    for (const kpi of kpisResult.rows) {
      let value = kpi.default_value || "";
      if (kpi.aggregation && kpi.aggregation !== "none" && kpi.source_column) {
        const colValues = rows.map((r) => Number(r[kpi.source_column])).filter((v) => !isNaN(v));
        if (colValues.length > 0) {
          switch (kpi.aggregation) {
            case "sum": value = colValues.reduce((a, b) => a + b, 0); break;
            case "avg": value = colValues.reduce((a, b) => a + b, 0) / colValues.length; break;
            case "count": value = colValues.length; break;
            case "max": value = Math.max(...colValues); break;
            case "min": value = Math.min(...colValues); break;
            case "latest": value = colValues[colValues.length - 1]; break;
          }
          if (kpi.value_type === "currency") value = `₹${value.toLocaleString("en-IN")}`;
          else if (kpi.value_type === "percentage") value = `${Math.round(value)}%`;
          else if (Number.isInteger(value)) value = value.toLocaleString("en-IN");
          else if (typeof value === "number") value = value.toLocaleString("en-IN", { maximumFractionDigits: 2 });
        }
      }
      await pool.query("UPDATE kpis SET current_value = $1, updated_at = NOW() WHERE id = $2", [String(value), kpi.id]);
      updates.push({ id: kpi.id, name: kpi.name, label: kpi.label, value: String(value) });
    }
    res.json({ kpis: updates });
  } catch (err) {
    console.error("Compute KPIs error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
