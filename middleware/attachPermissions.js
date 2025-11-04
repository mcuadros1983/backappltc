// server/middleware/attachPermissions.js
import Usuario from "../models/auth/usuarioModel.js";
import Rol from "../models/auth/rolModel.js";

export const attachPermissions = async (req, res, next) => {
  try {
    if (!req.user?.id) return next();

    // Buscar usuario con su rol
    const user = await Usuario.findByPk(req.user.id, {
      attributes: ["id", "usuario", "rol_id", "permissions"],
      include: [{ model: Rol, as: "roles", attributes: ["nombre"] }],
    });

    // Permisos base (si la columna 'permissions' existe)
    let perms = Array.isArray(user?.permissions) ? user.permissions : [];

    // ✅ Si el usuario tiene rol "admin" → darle admin.all
    const isAdmin = user?.roles?.some(
      (r) => r.nombre && r.nombre.toLowerCase() === "admin"
    );

    if (isAdmin && !perms.includes("admin.all")) {
      perms = ["admin.all", ...perms];
    }

    req.user = {
      ...req.user,
      rol_id: user?.rol_id,
      permissions: perms,
    };

    next();
  } catch (err) {
    console.error("attachPermissions error:", err);
    next();
  }
};
