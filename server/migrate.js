import pool from "./src/db.js";
import { runMigrations } from "./src/setupDatabase.js";

try {
  await runMigrations();
  console.log("Database setup complete.");
} catch (err) {
  console.error("Database setup failed:", err);
  process.exitCode = 1;
} finally {
  await pool.end();
}
