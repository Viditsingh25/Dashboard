import fs from "fs";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import pool from "./db.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

export async function runMigrations() {
  for (const name of ["schema.sql", "migration.sql"]) {
    const sql = fs.readFileSync(resolve(ROOT, name), "utf8");
    await pool.query(sql);
  }
}
