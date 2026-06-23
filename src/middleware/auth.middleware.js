import jwt from "jsonwebtoken";

function getBearerToken(req) {
  const authHeader = req.headers?.authorization;
  if (!authHeader) return null;

  const [scheme, token] = authHeader.split(" ");
  if (scheme !== "Bearer" || !token) return null;

  return token;
}

export function authMiddleware(req, _res, next) {
  const cookieToken = req.cookies?.token;
  const token = cookieToken || getBearerToken(req);

  if (!token) {
    req.auth = {
      hasTokenCookie: false,
      authenticated: false,
    };
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId ?? decoded.id ?? decoded._id;

    req.auth = {
      hasTokenCookie: Boolean(cookieToken),
      userId,
      role: decoded.role,
      authenticated: true,
    };
    req.user = { ...decoded, userId, id: userId, role: decoded.role };

    if (decoded.role === "admin") {
      console.info("[products] authenticated request", {
        method: req.method,
        path: req.originalUrl,
        userId,
        role: decoded.role,
      });
    }
  } catch (error) {
    req.auth = {
      hasTokenCookie: Boolean(cookieToken),
      authenticated: false,
      error: error.name,
    };
    req.user = undefined;
  }

  return next();
}

function createAuthMiddleware(roles = ["user"]) {
  return function requireRole(req, res, next) {
    if (!req.auth?.authenticated) {
      return res.status(401).json({
        message: req.auth?.error ? "Invalid token" : "No token provided",
      });
    }

    if (!roles.includes(req.auth.role)) {
      console.warn("[products] auth rejected: insufficient role", {
        method: req.method,
        url: req.originalUrl,
        requiredRoles: roles,
        userId: req.auth.userId,
        role: req.auth.role,
      });
      return res.status(403).json({ message: "Forbidden" });
    }

    return next();
  };
}

export default createAuthMiddleware;
