import pool from "../db.js";

export async function logEvent(level, message, req, userOverride) {
  try {
    await pool.query(
      `INSERT INTO system_logs (level, message, user_id, username, ip_address)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        level,
        message,
        userOverride?.id || req?.user?.id || null,
        userOverride?.username || req?.user?.username || null,
        req?.ip || req?.connection?.remoteAddress || null,
      ]
    );
  } catch (err) {
    console.error("Log write error:", err);
  }
}
