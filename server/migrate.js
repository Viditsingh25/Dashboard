import fs from "fs";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import pool from "./src/db.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function runSqlFile(name) {
  const sql = fs.readFileSync(resolve(__dirname, name), "utf8");
  console.log(`Applying ${name} ...`);
  await pool.query(sql);
  console.log(`Applied ${name}.`);
}

try {
  await runSqlFile("schema.sql");
  await runSqlFile("migration.sql");
  console.log("Database setup complete.");
} catch (err) {
  console.error("Database setup failed:", err.message);
} finally {
  await pool.end();
}
