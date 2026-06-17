import jwt from "jsonwebtoken";
import config from "../config/config.js";

function createAuthMiddleware(role = ["user"]) {
  return function authMiddleware(req, res, next) {
    const token =
      req.cookies.token || req.headers?.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    try {
      const decoded = jwt.verify(token, config.JWT_SECRET);
      if (!role.includes(decoded.role)) {
        return res.status(403).json({ message: "Forbidden" });
      }
      req.user = decoded;
      next();
    } catch (error) {
      return res.status(401).json({ message: "Invalid token" });
    }
  };
}

export default createAuthMiddleware;
