// middleware/authorizeAny.js
export const authorizeAny = (...required) => (req, res, next) => {
  const userPerms = req?.user?.permissions || [];
  const isAdmin = userPerms.includes("admin.all"); // o chequeá rol_id si preferís
  if (isAdmin) return next();
  const ok = required.every((p) => userPerms.includes(p));
  if (!ok) return res.status(403).json({ message: "No tienes permisos" });
  next();
};
