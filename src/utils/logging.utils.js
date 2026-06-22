const SENSITIVE_KEYS = new Set([
  "authorization",
  "cookie",
  "password",
  "token",
  "jwt",
  "secret",
]);

const MAX_STRING_LENGTH = 500;

const redactValue = (key, value) => {
  if (SENSITIVE_KEYS.has(String(key).toLowerCase())) {
    return "[redacted]";
  }

  if (typeof value === "string" && value.length > MAX_STRING_LENGTH) {
    return `${value.slice(0, MAX_STRING_LENGTH)}...[truncated]`;
  }

  if (Array.isArray(value)) {
    return value.map((item) => redactValue(key, item));
  }

  if (value && typeof value === "object") {
    return redactObject(value);
  }

  return value;
};

export const redactObject = (value = {}) =>
  Object.fromEntries(
    Object.entries(value || {}).map(([key, item]) => [key, redactValue(key, item)]),
  );

export const getAuthState = (req) => ({
  hasTokenCookie: Boolean(req.cookies?.token),
  hasAuthorizationHeader: Boolean(req.headers?.authorization),
  userId: req.user?.userId ?? req.user?.id,
  role: req.user?.role,
  authenticated: Boolean(req.user),
});

export const logRequest = (req, extra = {}) => {
  console.info("[products] request", {
    method: req.method,
    url: req.originalUrl,
    params: redactObject(req.params),
    query: redactObject(req.query),
    body: redactObject(req.body),
    auth: getAuthState(req),
    ...extra,
  });
};

export const logValidationErrors = (req, errors) => {
  console.warn("[products] validation failed", {
    method: req.method,
    url: req.originalUrl,
    params: redactObject(req.params),
    body: redactObject(req.body),
    auth: getAuthState(req),
    errors,
  });
};

export const logDbResult = (req, operation, result) => {
  console.info("[products] database result", {
    method: req.method,
    url: req.originalUrl,
    params: redactObject(req.params),
    auth: getAuthState(req),
    operation,
    result,
  });
};
