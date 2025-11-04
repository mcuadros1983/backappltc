// middleware/auditALSMiddleware.js
import { AsyncLocalStorage } from "async_hooks";
import crypto from "crypto";

const als = new AsyncLocalStorage();

// Exportá esto para usarlo en tus hooks de Sequelize
export function getAuditCtx() {
  return als.getStore() || {};
}

export function auditALSMiddleware(req, res, next) {
  const requestId = req.headers["x-request-id"] || crypto.randomUUID();
  const sessionId = req.cookies?.sessionId || null;
  const ip =
    req.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    req.ip ||
    null;

  const store = {
    // usuario (si jwtFromCookie lo seteo)
    usuario_id: req.user?.id ?? null,
    usuario: req.user?.usuario ?? null,

    // request meta
    ip,
    user_agent: req.headers["user-agent"] || null,
    ruta: req.originalUrl || req.url || null,
    metodo: req.method || null,

    // correlación
    request_id: requestId,
    session_id: sessionId,

    // por si necesitas empresa/sucursal en controllers y querés que viajen a hooks
    empresa_id: null,
    sucursal_id: null,
  };

  // Incluí empresa/sucursal si las mandás por header (opcional)
  const emp = req.headers["x-empresa-id"];
  const suc = req.headers["x-sucursal-id"];
  if (emp !== undefined) store.empresa_id = Number(emp) || null;
  if (suc !== undefined) store.sucursal_id = Number(suc) || null;

  als.run(store, () => next());
}
