import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import roleRoutes from "./routes/roles.js";
import settingsRoutes from "./routes/settings.js";
import moduleRoutes from "./routes/modules.js";
import kpiRoutes from "./routes/kpis.js";

const app = express();
const PORT = process.env.PORT || 3001;

const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((s) => s.trim())
  : ["http://localhost:3000", "http://localhost:5173"];

app.use(cors({ origin: corsOrigins, credentials: true }));
app.use(express.json({ limit: "5mb" }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/modules", moduleRoutes);
app.use("/api/kpis", kpiRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

if (process.env.RUN_MIGRATIONS === "true") {
  const { runMigrations } = await import("./setupDatabase.js");
  await runMigrations();
  console.log("Database migrations applied on startup.");
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
