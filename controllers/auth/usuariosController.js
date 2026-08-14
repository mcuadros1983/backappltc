import Usuario from "../../models/auth/usuarioModel.js";
import bcrypt from "bcrypt";
import { obtenerRolPorNombre } from "./rolesController.js";
import crypto from "crypto";
import Rol from "../../models/auth/rolModel.js";
import { sequelize } from "../../config/database.js";

// Utilidad: validar/normalizar array de permisos
const normalizePermissions = (value) => {
  if (!value) return undefined;               // no tocar si no vino
  if (Array.isArray(value)) {
    return value.map(String).filter(Boolean);
  }
  if (typeof value === "string") {
    // permite enviar "a,b,c" o un string simple
    return value.split(",").map(s => s.trim()).filter(Boolean);
  }
  throw new Error("Formato de 'permissions' inválido");
};


// (opcional) obtener un rol por nombre
// const obtenerRolPorNombre = async (nombreRol) => {
//   if (!nombreRol) return null;
//   const rol = await Rol.findOne({ where: { nombre: nombreRol } });
//   if (!rol) throw new Error(`Rol '${nombreRol}' no encontrado`);
//   return rol;
// };

/** =========================
 *  Usuarios - Básico (ya tenías)
 *  ========================= */
export const obtenerUsuarios = async (req, res, next) => {
  try {
    const usuarios = await Usuario.findAll({ include: "roles" });
    res.json(usuarios);
  } catch (error) {
    console.error(error);
    next(error);
  }
};

export const obtenerUsuarioPorId = async (req, res, next) => {
  try {
    const { id } = req.params;

    const usuario = await Usuario.findByPk(id, {
      attributes: ["id", "usuario", "rol_id", "sucursal_id", "permissions", "shortcuts", "fecha"],
      include: [{ model: Rol, as: "roles", attributes: ["id", "nombre"] }],
    });

    if (!usuario) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    res.json(usuario);
  } catch (error) {
    console.error(error);
    next(error);
  }
};

export const crearUsuario = async (req, res, next) => {
  const { usuario, password, nombreRol, sucursal_id } = req.body;
  try {
    const userFound = await obtenerUsuarioPorNombre(usuario);
    if (userFound) {
      return res.status(400).json({ error: "El usuario ya existe" });
    }

    const rol = await obtenerRolPorNombre(nombreRol);

    const newUser = await Usuario.create({
      usuario,
      password, // se hashea en beforeCreate
      rol_id: rol?.dataValues?.id,
      sucursal_id: sucursal_id || null,
      shortcuts: [], // por si acaso
    });

    await newUser.setRoles(rol);
    res.status(201).json(newUser);
  } catch (error) {
    console.error(error);
    next(error);
  }
};

// ✅ PUT /usuarios/:id (ahora soporta 'permissions')
export const actualizarUsuario = async (req, res, next) => {
  const { id } = req.params;
  const { usuario, password, nombreRol, sucursal_id, permissions } = req.body;

  const t = await sequelize.transaction();
  try {
    const usuarioExistente = await Usuario.findByPk(id, { transaction: t });
    if (!usuarioExistente) {
      await t.rollback();
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const nuevosDatos = {};

    if (usuario) nuevosDatos.usuario = usuario;

    if (sucursal_id !== undefined) {
      nuevosDatos.sucursal_id = sucursal_id || null;
    }

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      nuevosDatos.password = hashedPassword;
    }

    // 🔹 Nuevo: actualizar permisos si se enviaron
    const perms = normalizePermissions(permissions);
    if (perms !== undefined) {
      nuevosDatos.permissions = perms; // campo JSON en el modelo
    }

    if (nombreRol) {
      const rol = await obtenerRolPorNombre(nombreRol);
      nuevosDatos.rol_id = rol?.id ?? null;
      // belongsToMany → setRoles espera array
      await usuarioExistente.setRoles(rol ? [rol] : [], { transaction: t });
    }

    await usuarioExistente.update(nuevosDatos, { transaction: t });

    // Volver a cargar con relaciones y campos visibles
    const actualizado = await Usuario.findByPk(id, {
      attributes: ["id", "usuario", "rol_id", "sucursal_id", "permissions", "shortcuts", "fecha"],
      include: [{ model: Rol, as: "roles", attributes: ["id", "nombre"] }],
      transaction: t,
    });

    await t.commit();
    return res.json(actualizado);
  } catch (error) {
    console.error(error);
    await t.rollback();
    next(error);
  }
};

export const eliminarUsuario = async (req, res, next) => {
  const { id } = req.params;
  try {
    const usuarioExistente = await Usuario.findByPk(id);
    if (!usuarioExistente) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }
    await usuarioExistente.destroy();
    res.json({ message: "Usuario eliminado exitosamente" });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

// ⚠️ OJO: esta función la usás internamente; no es handler Express.
export const obtenerUsuarioPorNombre = async (usuario) => {
  try {
    const user = await Usuario.findOne({ where: { usuario } });
    if (user) return user;
    console.error("usuario no encontrado");
  } catch (error) {
    console.error(error);
  }
};

/** ===================================
 *  NUEVO: Accesos directos por usuario
 *  =================================== */

// ========================= Shortcuts (parches) =========================

const mkId = () =>
  (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);

const MAX_SHORTCUTS = 24; // subí el límite como gustes

function reindex(arr = []) {
  return arr.map((s, i) => ({ ...s, order: i }));
}

function dedupeByPath(arr = []) {
  const seen = new Set();
  return arr.filter(s => {
    const key = String(s.path || "").trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// GET /usuarios/:id/shortcuts
export const getUserShortcuts = async (req, res, next) => {
  try {
    const { id } = req.params;
    const u = await Usuario.findByPk(id, { attributes: ["id", "shortcuts"] });
    const list = Array.isArray(u?.shortcuts) ? u.shortcuts : [];
    console.log("[GET shortcuts]", { userId: id, count: list.length });
    res.json(list);
  } catch (err) {
    next(err);
  }
};

export const addUserShortcut = async (req, res, next) => {
  try {
    const { id } = req.params;
    let { label, path, icon, color, order } = req.body;
    if (!label || !path) return res.status(400).json({ message: "label y path son requeridos" });

    const u = await Usuario.findByPk(id);
    if (!u) return res.status(404).json({ message: "Usuario no encontrado" });

    const nextShortcuts = Array.isArray(u.shortcuts) ? [...u.shortcuts] : [];
    nextShortcuts.push({
      id: crypto.randomUUID(),
      label: String(label),
      path: String(path),
      icon: icon ? String(icon) : null,
      color: color ? String(color) : null,
      order: Number.isFinite(order) ? order : nextShortcuts.length,
    });

    await u.update({ shortcuts: nextShortcuts });
    res.status(201).json(nextShortcuts); // ⬅️ lista completa
  } catch (err) {
    next(err);
  }
};

// DELETE /usuarios/:id/shortcuts/:shortcutId
export const removeUserShortcut = async (req, res, next) => {
  try {
    const { id, shortcutId } = req.params;
    const u = await Usuario.findByPk(id);
    if (!u) return res.status(404).json({ message: "Usuario no encontrado" });

    const before = Array.isArray(u.shortcuts) ? u.shortcuts : [];
    const after = before.filter((s) => s.id !== shortcutId);

    if (after.length === before.length) {
      return res.status(404).json({ message: "Acceso directo no encontrado" });
    }

    await u.update({ shortcuts: after });
    // ⬅️ devolvemos la lista completa para que el front quede sincronizado
    res.json(after);
  } catch (err) {
    next(err);
  }
};


// PUT /usuarios/:id/shortcuts/reorder  (espera array de ids en orden)
export const reorderUserShortcuts = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { order } = req.body; // ['uuid3','uuid1','uuid2']
    if (!Array.isArray(order)) {
      return res.status(400).json({ message: "order debe ser un array de ids" });
    }

    const u = await Usuario.findByPk(id);
    if (!u) return res.status(404).json({ message: "Usuario no encontrado" });

    const before = Array.isArray(u.shortcuts) ? u.shortcuts : [];
    const map = new Map(before.map((s) => [s.id, s]));
    const set = new Set(order);

    // 1) primero, en el orden solicitado
    const ordered = order.map((id) => map.get(id)).filter(Boolean);
    // 2) luego, el resto que NO vinieron en 'order' (conservando su orden relativo)
    const remaining = before.filter((s) => !set.has(s.id));

    const result = [...ordered, ...remaining].map((s, idx) => ({ ...s, order: idx }));
    await u.update({ shortcuts: result });
    // devolvemos la lista completa
    res.json(result);
  } catch (err) {
    next(err);
  }
};

// (Opcional) PUT /usuarios/:id/shortcuts  -> reemplazo total, mantenelo sólo si lo necesitás.
// Si lo usás, ¡asegurate de mandarle objetos completos, no sólo IDs!
export const replaceUserShortcuts = async (req, res, next) => {
  try {
    const { id } = req.params;
    let { shortcuts } = req.body || {};

    console.log("[REPLACE shortcuts] IN", { userId: id, len: Array.isArray(shortcuts) ? shortcuts.length : 0 });

    if (!Array.isArray(shortcuts)) {
      return res.status(400).json({ message: "shortcuts debe ser un array" });
    }

    // Normalizá cada item
    const norm = shortcuts.map((s, i) => ({
      id: s.id || mkId(),
      label: s.label?.toString() ?? "",
      path: s.path?.toString() ?? "",
      icon: s.icon?.toString() ?? null,
      color: s.color?.toString() ?? null,
      order: Number.isFinite(s.order) ? s.order : i,
    }));

    const finalArr = reindex(dedupeByPath(norm).slice(0, MAX_SHORTCUTS));

    const u = await Usuario.findByPk(id);
    if (!u) return res.status(404).json({ message: "Usuario no encontrado" });

    u.shortcuts = finalArr;
    await u.save();

    console.log("[REPLACE shortcuts] OUT", { count: finalArr.length });
    res.json(finalArr);
  } catch (err) {
    next(err);
  }
};

export const getPermissions = async (req, res) => {
  const { id } = req.params;
  const u = await Usuario.findByPk(id, { attributes: ["id", "usuario", "permissions"] });
  if (!u) return res.status(404).json({ message: "Usuario no encontrado" });
  res.json({ permissions: u.permissions || [] });
};

export const setPermissions = async (req, res) => {
  const { id } = req.params;
  const { permissions } = req.body; // array de strings
  if (!Array.isArray(permissions)) return res.status(400).json({ message: "permissions debe ser array" });

  const u = await Usuario.findByPk(id);
  if (!u) return res.status(404).json({ message: "Usuario no encontrado" });

  u.permissions = permissions;
  await u.save();
  res.json({ message: "Permisos actualizados", permissions: u.permissions });
};