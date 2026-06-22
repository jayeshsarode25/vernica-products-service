import jwt from "jsonwebtoken";
import config from "../config/config.js";
import { getAuthState } from "../utils/logging.utils.js";

function getBearerToken(req) {
  const authHeader = req.headers?.authorization;
  if (!authHeader) return null;

  const [scheme, token] = authHeader.split(" ");
  if (scheme !== "Bearer" || !token) return null;

  return token;
}

function createAuthMiddleware(role = ["user"]) {
  return function authMiddleware(req, res, next) {
    const token = req.cookies?.token || getBearerToken(req);

    console.info("[products] auth check", {
      method: req.method,
      url: req.originalUrl,
      requiredRoles: role,
      auth: getAuthState(req),
    });

    if (!token) {
      console.warn("[products] auth rejected: no token", {
        method: req.method,
        url: req.originalUrl,
        requiredRoles: role,
      });
      return res.status(401).json({ message: "No token provided" });
    }

    try {
      const decoded = jwt.verify(token, config.JWT_SECRET);
      if (!role.includes(decoded.role)) {
        console.warn("[products] auth rejected: insufficient role", {
          method: req.method,
          url: req.originalUrl,
          requiredRoles: role,
          userId: decoded.userId ?? decoded.id,
          role: decoded.role,
        });
        return res.status(403).json({ message: "Forbidden" });
      }
      req.user = decoded;
      next();
    } catch (error) {
      console.warn("[products] auth rejected: invalid token", {
        method: req.method,
        url: req.originalUrl,
        error: error.name,
      });
      return res.status(401).json({ message: "Invalid token" });
    }
  };
}

export default createAuthMiddleware;
