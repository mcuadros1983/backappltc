// Inyecta datos útiles para logging (user, ip, UA, ruta, método)
export function auditoriaContext(req, _res, next) {
  try {
    // Si tu auth ya mete req.user, solo lo respetamos
    // Ej: req.user = { id, usuario, rol_id, ... }
    const ip = (req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "").toString();
    req.clientInfo = {
      ip,
      user_agent: req.headers["user-agent"] || "",
      ruta: req.originalUrl || req.url || "",
      metodo: (req.method || "").toUpperCase(),
    };
  } catch (_) {
    // noop
  }
  next();
}
