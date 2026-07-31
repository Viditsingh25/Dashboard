import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

function buildPoolConfig() {
  const url = process.env.DATABASE_URL || "";

  const wantsSsl =
    process.env.PGSSLMODE === "require" ||
    process.env.PGSSL === "true" ||
    /(?:^|&)sslmode=require(?:&|$)/.test(url);

  if (url) {
    return {
      connectionString: url,
      ssl: wantsSsl ? { rejectUnauthorized: false } : false,
    };
  }

  return {
    host: process.env.PGHOST || "localhost",
    port: parseInt(process.env.PGPORT || "5432"),
    database: process.env.PGDATABASE || "kims_dashboard",
    user: process.env.PGUSER || "postgres",
    password: process.env.PGPASSWORD || "postgres",
    ssl: wantsSsl ? { rejectUnauthorized: false } : false,
  };
}

const pool = new pg.Pool(buildPoolConfig());

pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
});

export default pool;
