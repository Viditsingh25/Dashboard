import bcrypt from "bcrypt";
import pool from "../db.js";

export async function getPolicies() {
  const result = await pool.query("SELECT * FROM password_policies ORDER BY id LIMIT 1");
  return result.rows[0] || {
    min_length: 6,
    require_uppercase: false,
    require_number: false,
    require_symbol: false,
    expiry_days: 0,
    history_count: 0,
    max_failed_attempts: 5,
    lockout_minutes: 30,
  };
}

export function validatePassword(password, policies, currentPassword) {
  const errors = [];

  if (password.length < policies.min_length) {
    errors.push(`Password must be at least ${policies.min_length} characters`);
  }

  if (policies.require_uppercase && !/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  if (policies.require_number && !/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  if (policies.require_symbol && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password)) {
    errors.push("Password must contain at least one special character");
  }

  if (currentPassword && password === currentPassword) {
    errors.push("New password must be different from current password");
  }

  return errors;
}

export async function checkPasswordHistory(userId, password, historyCount) {
  if (!historyCount || historyCount <= 0) return [];

  const result = await pool.query(
    "SELECT password_hash FROM password_history WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2",
    [userId, historyCount]
  );

  const matched = [];
  for (const row of result.rows) {
    const match = await bcrypt.compare(password, row.password_hash);
    if (match) matched.push("You cannot reuse a recent password");
  }

  return matched;
}

export async function storePasswordHistory(userId, passwordHash) {
  const policy = await getPolicies();
  await pool.query(
    "INSERT INTO password_history (user_id, password_hash) VALUES ($1, $2)",
    [userId, passwordHash]
  );

  if (policy.history_count > 0) {
    await pool.query(
      `DELETE FROM password_history
       WHERE user_id = $1 AND id NOT IN (
         SELECT id FROM password_history
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT $2
       )`,
      [userId, policy.history_count]
    );
  }
}

export function getPasswordRequirements(policies) {
  const reqs = [];
  reqs.push(`Minimum ${policies.min_length} characters`);
  if (policies.require_uppercase) reqs.push("At least 1 uppercase letter");
  if (policies.require_number) reqs.push("At least 1 number");
  if (policies.require_symbol) reqs.push("At least 1 special character");
  if (policies.history_count > 0) reqs.push(`Cannot reuse last ${policies.history_count} passwords`);
  return reqs;
}
