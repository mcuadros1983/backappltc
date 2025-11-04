import { sequelize } from "../../config/database.js";
import { Op } from "sequelize";
import Evento from "../../models/asistencia/Evento.js";

const validar = (body) => {
  const { fecha_desde, fecha_hasta, concepto_id, empleado_id, sucursal_id } = body || {};
  if (!fecha_desde) return "fecha_desde es requerida";
  if (!fecha_hasta) return "fecha_hasta es requerida";
  if (new Date(fecha_desde) > new Date(fecha_hasta)) return "fecha_desde no puede ser mayor que fecha_hasta";
  if (!concepto_id) return "concepto_id es requerido";
  if (!empleado_id) return "empleado_id es requerido";
  if (!sucursal_id) return "sucursal_id es requerido";
  return null;
};

export const crearEvento = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const err = validar(req.body);
    if (err) { await t.rollback(); return res.status(400).json({ error: err }); }

    const row = await Evento.create(req.body, { transaction: t });
    await t.commit();
    return res.status(201).json(row);
  } catch (e) {
    await t.rollback();
    console.error("❌ crearEvento:", e);
    return res.status(500).json({ error: "Error al crear evento", detalle: e.message });
  }
};

export const listarEventos = async (req, res) => {
  try {
    const {
      start_date,   // YYYY-MM-DD
      end_date,     // YYYY-MM-DD
      sucursal_id,
      empleado_id,
      concepto_id,
      order = "fecha_desde",
      dir = "ASC",
      limit,
      offset,
    } = req.query;

    const where = {};

    // Filtro por superposición de intervalos:
    // (evento.fecha_desde <= end_date) AND (evento.fecha_hasta >= start_date)
    if (start_date && end_date) {
      where[Op.and] = [
        { fecha_desde: { [Op.lte]: end_date } },
        { fecha_hasta: { [Op.gte]: start_date } },
      ];
    } else {
      // Filtros simples si te mandan sólo uno
      if (start_date) where.fecha_hasta = { [Op.gte]: start_date };
      if (end_date) where.fecha_desde = { [Op.lte]: end_date };
    }

    if (sucursal_id) where.sucursal_id = Number(sucursal_id);
    if (empleado_id) where.empleado_id = Number(empleado_id);
    if (concepto_id) where.concepto_id = Number(concepto_id);

    const rows = await Evento.findAll({
      where,
      order: [[order, String(dir).toUpperCase() === "DESC" ? "DESC" : "ASC"]],
      ...(limit ? { limit: Number(limit) } : {}),
      ...(offset ? { offset: Number(offset) } : {}),
    });

    // Devolvemos array directo (tu frontend ya lo soporta)
    return res.status(200).json(rows);
  } catch (err) {
    console.error("❌ listarEventos:", err);
    return res.status(500).json({ error: "Error al listar eventos" });
  }
};

export const obtenerEventoPorId = async (req, res) => {
  try {
    const row = await Evento.findByPk(req.params.id);
    if (!row) return res.status(404).json({ error: "Evento no encontrado" });
    return res.status(200).json(row);
  } catch (e) {
    console.error("❌ obtenerEventoPorId:", e);
    return res.status(500).json({ error: "Error al obtener evento" });
  }
};

export const actualizarEvento = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    // Validamos con merge mínimo para no exigir todos los campos si no los envían
    const err = validar({
      fecha_desde: req.body?.fecha_desde ?? "1900-01-01",
      fecha_hasta: req.body?.fecha_hasta ?? "2900-01-01",
      concepto_id: req.body?.concepto_id ?? 1,
      empleado_id: req.body?.empleado_id ?? 1,
      sucursal_id: req.body?.sucursal_id ?? 1,
    });
    if (err) { await t.rollback(); return res.status(400).json({ error: err }); }

    const row = await Evento.findByPk(req.params.id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!row) { await t.rollback(); return res.status(404).json({ error: "Evento no encontrado" }); }

    await row.update(req.body, { transaction: t });
    await t.commit();
    return res.status(200).json(row);
  } catch (e) {
    await t.rollback();
    console.error("❌ actualizarEvento:", e);
    return res.status(500).json({ error: "Error al actualizar evento", detalle: e.message });
  }
};

export const eliminarEvento = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const row = await Evento.findByPk(req.params.id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!row) { await t.rollback(); return res.status(404).json({ error: "Evento no encontrado" }); }

    await row.destroy({ transaction: t });
    await t.commit();
    return res.status(200).json({ mensaje: "Evento eliminado correctamente" });
  } catch (e) {
    await t.rollback();
    console.error("❌ eliminarEvento:", e);
    return res.status(500).json({ error: "Error al eliminar evento", detalle: e.message });
  }
};
