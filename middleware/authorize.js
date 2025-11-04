// server/middleware/authorize.js
export const authorize = (...requiredPerms) => (req, res, next) => {
  const user = req.user || {};
  const perms = Array.isArray(user.permissions) ? user.permissions : [];

  // Bypass admin por rol o permiso global (ajustá a tu criterio):
  const isAdminRole = Number(user.rol_id) === 1; // si tu admin es rol_id=1
  const hasAdminAll = perms.includes("admin.all");

  if (isAdminRole || hasAdminAll) return next();

  const ok = requiredPerms.every((p) => perms.includes(p));
  if (!ok) {
    return res.status(403).json({
      message: "No tienes permisos para realizar esta acción",
      required: requiredPerms,
    });
  }
  next();
};
