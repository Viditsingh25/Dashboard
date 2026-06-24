import jwt from "jsonwebtoken";

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

export function authorize(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
}

export function createToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role_name, site: user.site },
    JWT_SECRET,
    { expiresIn: "24h" }
  );
}
