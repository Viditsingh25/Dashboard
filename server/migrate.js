import fs from "fs";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import pool from "./src/db.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const sql = fs.readFileSync(resolve(__dirname, "migration.sql"), "utf8");

try {
  await pool.query(sql);
  console.log("Migration applied successfully.");
} catch (err) {
  console.error("Migration failed:", err.message);
} finally {
  await pool.end();
}
