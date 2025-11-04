// server/middleware/auditContextMiddleware.js
export function auditContextMiddleware(req, _res, next) {
  const user = req.user || null; // viene de jwtMiddleware

  req.auditCtx = {
    userId: user?.id ?? null,
    username: user?.usuario ?? user?.username ?? null,
    empresa_id: user?.empresa_id ?? null,
    sucursal_id: user?.sucursal_id ?? null,
    ip: req.ip || (req.headers["x-forwarded-for"] || "").split(",")[0] || null,
    user_agent: req.headers["user-agent"] || null,
    ruta: req.originalUrl || null,
    metodo: req.method || null,
    request_id: req.headers["x-request-id"] || null,
    session_id: req.session?.id || null,
  };
  next();
}
