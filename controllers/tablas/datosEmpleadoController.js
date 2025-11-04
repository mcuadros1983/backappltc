import { sequelize } from "../../config/database.js";
import DatosEmpleado from "../../models/tablas/datosEmpleadoModel.js";

// Helpers
const is1to7orNull = (x) =>
  x == null || (Number.isInteger(Number(x)) && Number(x) >= 1 && Number(x) <= 7);

const telefonoOk = (x) =>
  x == null || /^[+()\-. \s0-9]+$/.test(String(x));

const enteroPositivoONull = (x) =>
  x == null || (Number.isInteger(Number(x)) && Number(x) > 0);

// ─────────────────────────────────────────────
//  UPSERT (POST/PUT /empleados/:empleado_id/datos)
// ─────────────────────────────────────────────
export const upsertPorEmpleado = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const empleado_id = Number(req.params.empleado_id || req.body.empleado_id);
    if (!empleado_id) {
      await t.rollback();
      return res.status(400).json({ error: "empleado_id es requerido" });
    }

    // Armamos "changes" SOLO con las claves que llegaron en el body.
    const changes = {};

    if (Object.prototype.hasOwnProperty.call(req.body, "sucursal_id")) {
      const v = req.body.sucursal_id;
      changes.sucursal_id = (v === null || v === "" ? null : Number(v));
    }

    // ⬇️ jornada_id reemplaza a turno_id
    if (Object.prototype.hasOwnProperty.call(req.body, "jornada_id")) {
      const v = req.body.jornada_id;
      changes.jornada_id = (v === null || v === "" ? null : Number(v));
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "telefono")) {
      const v = req.body.telefono;
      changes.telefono = (v === null || v === "" ? null : String(v).trim());
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "franco_am")) {
      const v = req.body.franco_am;
      changes.franco_am = (v === null || v === "" ? null : Number(v));
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "franco_pm")) {
      const v = req.body.franco_pm;
      changes.franco_pm = (v === null || v === "" ? null : Number(v));
    }

    // ── Validaciones SOLO sobre campos que intento cambiar ──
    if (
      Object.prototype.hasOwnProperty.call(changes, "franco_am") &&
      !is1to7orNull(changes.franco_am)
    ) {
      await t.rollback();
      return res
        .status(400)
        .json({ error: "franco_am debe estar entre 1 y 7 o ser null" });
    }

    if (
      Object.prototype.hasOwnProperty.call(changes, "franco_pm") &&
      !is1to7orNull(changes.franco_pm)
    ) {
      await t.rollback();
      return res
        .status(400)
        .json({ error: "franco_pm debe estar entre 1 y 7 o ser null" });
    }

    if (
      Object.prototype.hasOwnProperty.call(changes, "telefono") &&
      !telefonoOk(changes.telefono)
    ) {
      await t.rollback();
      return res.status(400).json({ error: "Formato de teléfono inválido" });
    }

    if (
      Object.prototype.hasOwnProperty.call(changes, "jornada_id") &&
      !enteroPositivoONull(changes.jornada_id)
    ) {
      await t.rollback();
      return res.status(400).json({
        error: "jornada_id debe ser un entero positivo o null",
      });
    }

    // Upsert 1:1 por empleado_id
    const [row, created] = await DatosEmpleado.findOrCreate({
      where: { empleado_id },
      defaults: { empleado_id, ...changes },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!created && Object.keys(changes).length > 0) {
      await row.update(changes, { transaction: t });
    }

    await t.commit();
    return res.status(created ? 201 : 200).json(row);
  } catch (error) {
    await t.rollback();
    console.error("❌ upsertPorEmpleado:", error);
    return res.status(500).json({
      error: "Error guardando datos del empleado",
      detalle: error.message,
    });
  }
};

// ─────────────────────────────────────────────
//  GET /empleados/:empleado_id/datos
// ─────────────────────────────────────────────
export const obtenerPorEmpleado = async (req, res) => {
  try {
    const empleado_id = Number(req.params.empleado_id);
    if (!empleado_id)
      return res.status(400).json({ error: "empleado_id es requerido" });

    const row = await DatosEmpleado.findOne({ where: { empleado_id } });
    if (!row)
      return res
        .status(404)
        .json({ error: "Datos del empleado no encontrados" });

    return res.status(200).json(row);
  } catch (error) {
    console.error("❌ obtenerPorEmpleado:", error);
    return res
      .status(500)
      .json({ error: "Error al obtener los datos del empleado" });
  }
};

// ─────────────────────────────────────────────
//  DELETE /empleados/:empleado_id/datos
// ─────────────────────────────────────────────
export const eliminarPorEmpleado = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const empleado_id = Number(req.params.empleado_id);
    if (!empleado_id) {
      await t.rollback();
      return res.status(400).json({ error: "empleado_id es requerido" });
    }

    const row = await DatosEmpleado.findOne({
      where: { empleado_id },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!row) {
      await t.rollback();
      return res
        .status(404)
        .json({ error: "Datos del empleado no encontrados" });
    }

    await row.destroy({ transaction: t });
    await t.commit();
    return res
      .status(200)
      .json({ mensaje: "Datos del empleado eliminados" });
  } catch (error) {
    await t.rollback();
    console.error("❌ eliminarPorEmpleado:", error);
    return res.status(500).json({
      error: "Error al eliminar los datos del empleado",
      detalle: error.message,
    });
  }
};

// ─────────────────────────────────────────────
//  GET /datosempleado?{sucursal_id?, jornada_id?, ...}
// ─────────────────────────────────────────────
export const listar = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(1000, Math.max(1, Number(req.query.limit) || 50));
    const offset = (page - 1) * limit;

    const where = {};
    if (req.query.sucursal_id)
      where.sucursal_id = Number(req.query.sucursal_id);
    if (req.query.jornada_id)
      where.jornada_id = Number(req.query.jornada_id); // <- reemplaza turno_id

    const { rows, count } = await DatosEmpleado.findAndCountAll({
      where,
      order: [["empleado_id", "ASC"]],
      limit,
      offset,
    });

    return res
      .status(200)
      .json({ items: rows, page, limit, total: count });
  } catch (error) {
    console.error("❌ listar:", error);
    return res.status(500).json({
      error: "Error al listar datos de empleados",
      detalle: error.message,
    });
  }
};
