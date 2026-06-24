import { Router } from "express";
import pool from "../db.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = Router();

// GET /api/settings/password-policies
router.get("/password-policies", authenticate, authorize("superadmin", "admin"), async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM password_policies ORDER BY id LIMIT 1");
    if (result.rows.length === 0) {
      return res.json({
        min_length: 6,
        require_uppercase: false,
        require_number: false,
        require_symbol: false,
        expiry_days: 0,
        history_count: 0,
        max_failed_attempts: 5,
        lockout_minutes: 30,
      });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Get password policies error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/settings/password-policies
router.put("/password-policies", authenticate, authorize("superadmin", "admin"), async (req, res) => {
  const {
    min_length,
    require_uppercase,
    require_number,
    require_symbol,
    expiry_days,
    history_count,
    max_failed_attempts,
    lockout_minutes,
  } = req.body;

  try {
    const result = await pool.query("SELECT id FROM password_policies ORDER BY id LIMIT 1");
    if (result.rows.length === 0) {
      await pool.query(
        `INSERT INTO password_policies (min_length, require_uppercase, require_number, require_symbol,
          expiry_days, history_count, max_failed_attempts, lockout_minutes, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
        [min_length, require_uppercase, require_number, require_symbol, expiry_days, history_count, max_failed_attempts, lockout_minutes]
      );
    } else {
      await pool.query(
        `UPDATE password_policies SET
          min_length = $1, require_uppercase = $2, require_number = $3, require_symbol = $4,
          expiry_days = $5, history_count = $6, max_failed_attempts = $7, lockout_minutes = $8,
          updated_at = NOW()
         WHERE id = $9`,
        [min_length, require_uppercase, require_number, require_symbol, expiry_days, history_count, max_failed_attempts, lockout_minutes, result.rows[0].id]
      );
    }

    const updated = await pool.query("SELECT * FROM password_policies ORDER BY id LIMIT 1");
    res.json(updated.rows[0]);
  } catch (err) {
    console.error("Update password policies error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/settings/logs
router.get("/logs", authenticate, authorize("superadmin", "admin"), async (req, res) => {
  const { page = 1, limit = 50, level, search } = req.query;
  const offset = (Math.max(1, Number(page)) - 1) * Number(limit);
  const conditions = [];
  const params = [];

  if (level && ["info", "warning", "error"].includes(level)) {
    conditions.push(`level = $${params.length + 1}`);
    params.push(level);
  }

  if (search) {
    conditions.push(`message ILIKE $${params.length + 1}`);
    params.push(`%${search}%`);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  try {
    const countResult = await pool.query(`SELECT COUNT(*) FROM system_logs ${where}`, params);
    const total = parseInt(countResult.rows[0].count, 10);

    const result = await pool.query(
      `SELECT id, level, message, user_id, username, ip_address, created_at
       FROM system_logs ${where}
       ORDER BY created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, Number(limit), offset]
    );

    res.json({
      logs: result.rows,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    });
  } catch (err) {
    console.error("Get logs error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
