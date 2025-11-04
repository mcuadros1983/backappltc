// /src/controllers/asistencia/huellaNavegadorController.js
import { Op, UniqueConstraintError } from "sequelize";
import { sequelize } from "../../config/database.js";
import HuellaNavegador from "../../models/asistencia/huellaNavegador.js";

function getClientIp(req) {
  const xf = req.headers["x-forwarded-for"];
  if (typeof xf === "string" && xf.length) {
    const first = xf.split(",")[0].trim();
    if (first) return first;
  }
  return req.socket?.remoteAddress || "0.0.0.0";
}

// helpers (arriba del archivo)
const normalizeFp = (v) => String(v || '')
  .trim()
  .toLowerCase()
  .replace(/^android-/, ''); // quita prefijo si venía

// export const crearHuellaNavegador = async (req, res) => {
//   const t = await sequelize.transaction();
//   try {
//     const {
//       empleado_id = null,
//       sucursal_id,
//       fingerprint,
//       ip_address,
//     } = req.body || {};

//     // Validaciones mínimas
//     if (!sucursal_id || !fingerprint) {
//       await t.rollback();
//       return res
//         .status(400)
//         .json({ error: "sucursal_id y fingerprint son requeridos" });
//     }

//     // Resolver IP (server-side)
//     const ip = ip_address || getClientIp(req);

//     // UPSERT por (sucursal_id, fingerprint)
//     const [row, created] = await HuellaNavegador.findOrCreate({
//       where: { sucursal_id: Number(sucursal_id), fingerprint: String(fingerprint) },
//       defaults: {
//         empleado_id: empleado_id ?? null,
//         ip_address: ip,
//         accessed_at: new Date(),
//       },
//       transaction: t,
//       lock: t.LOCK.UPDATE,
//     });

//     if (!created) {
//       // Si ya existía, refrescamos campos “vivos”
//       if (empleado_id !== undefined) row.empleado_id = empleado_id;
//       row.ip_address = ip;
//       row.accessed_at = new Date();
//       await row.save({ transaction: t });
//     }

//     await t.commit();
//     return res.status(created ? 201 : 200).json({
//       id: row.id,
//       empleado_id: row.empleado_id,
//       sucursal_id: row.sucursal_id,
//       fingerprint: row.fingerprint,
//       ip_address: row.ip_address,
//       accessed_at: row.accessed_at,
//       created: created,
//     });
//   } catch (e) {
//     await t.rollback();
//     // Choque de índice único (sucursal_id, fingerprint)
//     if (e instanceof UniqueConstraintError) {
//       return res.status(409).json({
//         error: "La combinación sucursal_id + fingerprint ya existe",
//         detalle: e.message,
//       });
//     }
//     console.error("❌ crearHuellaNavegador:", e);
//     return res
//       .status(500)
//       .json({ error: "Error al crear/actualizar huella", detalle: e.message });
//   }
// };

// ====== crearHuellaNavegador ======
export const crearHuellaNavegador = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const {
      empleado_id = null,
      sucursal_id,
      fingerprint,
      ip_address,
    } = req.body || {};

    if (!sucursal_id || !fingerprint) {
      await t.rollback();
      return res.status(400).json({ error: "sucursal_id y fingerprint son requeridos" });
    }

    const sid = Number(sucursal_id);
    const normFp = normalizeFp(fingerprint);
    const ip = ip_address || getClientIp(req);

    console.log('📝 crearHuellaNavegador sid=%s fp(raw)=%s fp(norm)=%s ip=%s',
      sid, fingerprint, normFp, ip);

    const [row, created] = await HuellaNavegador.findOrCreate({
      where: { sucursal_id: sid, fingerprint: normFp }, // 👈 normalizado
      defaults: {
        empleado_id: empleado_id ?? null,
        ip_address: ip,
        accessed_at: new Date(),
      },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!created) {
      if (empleado_id !== undefined) row.empleado_id = empleado_id;
      row.ip_address = ip;
      row.accessed_at = new Date();
      await row.save({ transaction: t });
    }

    await t.commit();
    return res.status(created ? 201 : 200).json({
      id: row.id,
      empleado_id: row.empleado_id,
      sucursal_id: row.sucursal_id,
      fingerprint: row.fingerprint,
      ip_address: row.ip_address,
      accessed_at: row.accessed_at,
      created,
    });
  } catch (e) {
    await t.rollback();
    // ...
    throw e;
  }
};

// export const listarHuellasNavegador = async (req, res) => {
//   try {
//     const page = Math.max(1, Number(req.query.page) || 1);
//     const limit = Math.min(1000, Math.max(1, Number(req.query.limit) || 50));
//     const offset = (page - 1) * limit;

//     const where = {};
//     if (req.query.empleado_id) where.empleado_id = Number(req.query.empleado_id);
//     if (req.query.sucursal_id) where.sucursal_id = Number(req.query.sucursal_id); // 👈 NUEVO filtro
//     if (req.query.ip_address) where.ip_address = String(req.query.ip_address);
//     if (req.query.fingerprint) where.fingerprint = String(req.query.fingerprint);

//     if (req.query.desde || req.query.hasta) {
//       where.accessed_at = {};
//       if (req.query.desde) where.accessed_at[Op.gte] = new Date(req.query.desde);
//       if (req.query.hasta) where.accessed_at[Op.lte] = new Date(req.query.hasta);
//     }

//     const { rows, count } = await HuellaNavegador.findAndCountAll({
//       where,
//       order: [["accessed_at", "DESC"]],
//       limit,
//       offset,
//     });
//     return res.status(200).json({ items: rows, page, limit, total: count });
//   } catch (e) {
//     console.error("❌ listarHuellasNavegador:", e);
//     return res
//       .status(500)
//       .json({ error: "Error al listar huellas", detalle: e.message });
//   }
// };

// ====== listarHuellasNavegador ======
export const listarHuellasNavegador = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(1000, Math.max(1, Number(req.query.limit) || 50));
    const offset = (page - 1) * limit;

    const where = {};
    if (req.query.empleado_id) where.empleado_id = Number(req.query.empleado_id);
    if (req.query.sucursal_id) where.sucursal_id = Number(req.query.sucursal_id);

    if (req.query.ip_address) where.ip_address = req.query.ip_address;
    if (req.query.fingerprint) where.fingerprint = normalizeFp(req.query.fingerprint); // 👈 normalizado al buscar

    if (req.query.desde || req.query.hasta) {
      where.accessed_at = {};
      if (req.query.desde) where.accessed_at[Op.gte] = new Date(req.query.desde);
      if (req.query.hasta) where.accessed_at[Op.lte] = new Date(req.query.hasta);
    }

    console.log('🔎 listarHuellasNavegador where=', where);

    const { rows, count } = await HuellaNavegador.findAndCountAll({
      where,
      order: [["accessed_at", "DESC"]],
      limit, offset,
    });

    console.log('📤 listarHuellas -> count=%s first=%o',
      count,
      rows[0] ? { id: rows[0].id, sucursal_id: rows[0].sucursal_id, fingerprint: rows[0].fingerprint } : null
    );
    res.set('Cache-Control', 'no-store'); // sólo mientras debuggeás
    return res.status(200).json({ items: rows, page, limit, total: count });
  } catch (e) {
    console.error("❌ listarHuellasNavegador:", e);
    return res.status(500).json({ error: "Error al listar huellas", detalle: e.message });
  }
};

export const obtenerHuellaNavegadorPorId = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: "id debe ser entero" });
    }
    const row = await HuellaNavegador.findByPk(id);
    if (!row) return res.status(404).json({ error: "Huella no encontrada" });
    return res.status(200).json(row);
  } catch (e) {
    console.error("❌ obtenerHuellaNavegadorPorId:", e);
    return res.status(500).json({ error: "Error al obtener la huella" });
  }
};
export const actualizarHuellaNavegador = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const row = await HuellaNavegador.findByPk(req.params.id, {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!row) {
      await t.rollback();
      return res.status(404).json({ error: "Huella no encontrada" });
    }

    // Si se intenta cambiar sucursal_id o fingerprint, validamos que no choque con otro registro.
    const nextSucursalId =
      req.body.sucursal_id !== undefined ? Number(req.body.sucursal_id) : row.sucursal_id;
    const nextFingerprint =
      req.body.fingerprint !== undefined ? String(req.body.fingerprint) : row.fingerprint;

    if (nextSucursalId !== row.sucursal_id || nextFingerprint !== row.fingerprint) {
      const exists = await HuellaNavegador.findOne({
        where: {
          sucursal_id: nextSucursalId,
          fingerprint: nextFingerprint,
          id: { [Op.ne]: row.id },
        },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
      if (exists) {
        await t.rollback();
        return res.status(409).json({
          error: "La combinación sucursal_id + fingerprint ya está usada por otro registro",
        });
      }
    }

    // Resolver IP si viene vacío; si cambian fingerprint/ip, refrescamos accessed_at
    const willTouchAccessed =
      req.body.fingerprint !== undefined ||
      req.body.ip_address !== undefined ||
      req.body.sucursal_id !== undefined;

    const payload = {
      ...req.body,
      ip_address:
        req.body.ip_address !== undefined
          ? (req.body.ip_address || getClientIp(req))
          : row.ip_address,
      accessed_at: willTouchAccessed ? new Date() : row.accessed_at,
    };

    await row.update(payload, { transaction: t });
    await t.commit();
    return res.status(200).json(row);
  } catch (e) {
    await t.rollback();
    if (e instanceof UniqueConstraintError) {
      return res.status(409).json({
        error: "La combinación sucursal_id + fingerprint ya existe",
        detalle: e.message,
      });
    }
    console.error("❌ actualizarHuellaNavegador:", e);
    return res
      .status(500)
      .json({ error: "Error al actualizar la huella", detalle: e.message });
  }
};

export const eliminarHuellaNavegador = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const row = await HuellaNavegador.findByPk(req.params.id, {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!row) {
      await t.rollback();
      return res.status(404).json({ error: "Huella no encontrada" });
    }
    await row.destroy({ transaction: t });
    await t.commit();
    return res.status(200).json({ mensaje: "Huella eliminada correctamente" });
  } catch (e) {
    await t.rollback();
    console.error("❌ eliminarHuellaNavegador:", e);
    return res
      .status(500)
      .json({ error: "Error al eliminar la huella", detalle: e.message });
  }
};

// GET /huellanavegador/exists?fingerprint=...
export const existeHuellaPorFingerprint = async (req, res) => {
  try {
    const fp = normalizeFp(req.query.fingerprint || '');
    if (!fp) return res.status(400).json({ ok: false, error: 'fingerprint requerido' });

    const row = await HuellaNavegador.findOne({
      where: { fingerprint: fp },
      attributes: ['id', 'fingerprint', 'sucursal_id', 'empleado_id', 'accessed_at'],
    });

    return res.json({ ok: !!row, match: row || null });
  } catch (e) {
    console.error('❌ existeHuellaPorFingerprint:', e);
    return res.status(500).json({ ok: false, error: 'Error verificando huella' });
  }
};
