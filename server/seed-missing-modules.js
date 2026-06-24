import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

const pool = new pg.Pool({
  host: process.env.PGHOST || "localhost",
  port: parseInt(process.env.PGPORT || "5432"),
  database: process.env.PGDATABASE || "kims_dashboard",
  user: process.env.PGUSER || "postgres",
  password: process.env.PGPASSWORD || "postgres",
});

const modules = [
  { name: "doctors", label: "Doctors Payout", path: "/doctors", icon: "Stethoscope", sort_order: 8 },
  { name: "nursing", label: "Nursing", path: "/nursing", icon: "ClipboardList", sort_order: 9 },
];

async function seed() {
  const client = await pool.connect();
  try {
    for (const m of modules) {
      const { name, label, path, icon, sort_order } = m;
      await client.query(
        `INSERT INTO modules (name, label, path, icon, sort_order)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (name) DO NOTHING`,
        [name, label, path, icon, sort_order]
      );
      console.log(`  ${name}: ${label} (${path})`);
    }
    console.log("Done.");
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
