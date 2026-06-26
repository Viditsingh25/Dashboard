import jwt from "jsonwebtoken";
import pool from "../db.js";

const JWT_SECRET = process.env.JWT_SECRET || "kims-dashboard-jwt-secret-change-in-production";

export function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const token = header.split(" ")[1];
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function authorize(...requiredRoles) {
  return (req, res, next) => {
    const userRoles = req.user.roles || [req.user.role];
    if (!userRoles.some(r => requiredRoles.includes(r))) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
}

export function createToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, roles: user.roles || [user.role_name], site: user.site },
    JWT_SECRET,
    { expiresIn: "24h" }
  );
}

export async function getUserRoles(userId) {
  const result = await pool.query(
    `SELECT r.name, r.label, r.landing_path, r.allowed_paths, r.active
     FROM roles r JOIN user_roles ur ON ur.role_id = r.id
     WHERE ur.user_id = $1 AND r.deleted_at IS NULL AND r.active = true`,
    [userId]
  );
  return result.rows;
}

export function mergeRolePermissions(rolesData) {
  const allowedPaths = new Set();
  let landingPath = "/";
  if (rolesData.length > 0) {
    landingPath = rolesData[0].landing_path || "/";
    for (const r of rolesData) {
      const paths = r.allowed_paths || [];
      for (const p of paths) allowedPaths.add(p);
    }
  }
  return { landingPath, allowedPaths: [...allowedPaths] };
}
