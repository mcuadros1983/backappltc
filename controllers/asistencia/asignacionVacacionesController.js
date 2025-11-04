import { Op } from "sequelize";
import { sequelize } from "../../config/database.js";
import AsignacionVacaciones from "../../models/asistencia/asignacionVacaciones.js";

const validar = (body) => {
  const { periodo, dias_vacaciones, fecha_desde, fecha_hasta, empleado_id } = body || {};
  if (!empleado_id) return "empleado_id es requerido";
  if (!periodo || Number.isNaN(Number(periodo))) return "periodo inválido";
  if (!dias_vacaciones || Number(dias_vacaciones) <= 0) return "dias_vacaciones debe ser > 0";
  if (fecha_desde && fecha_hasta && new Date(fecha_desde) > new Date(fecha_hasta)) {
    return "fecha_desde no puede ser mayor que fecha_hasta";
  }
  return null;
};

export const crearAsignacionVacaciones = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const err = validar(req.body);
    if (err) { await t.rollback(); return res.status(400).json({ error: err }); }

    const row = await AsignacionVacaciones.create(req.body, { transaction: t });
    await t.commit();
    return res.status(201).json(row);
  } catch (e) {
    await t.rollback();
    console.error("❌ crearAsignacionVacaciones:", e);
    return res.status(500).json({ error: "Error al crear asignación", detalle: e.message });
  }
};

export const listarAsignacionesVacaciones = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(1000, Math.max(1, Number(req.query.limit) || 50));
    const offset = (page - 1) * limit;

    const where = {};
    if (req.query.empleado_id) where.empleado_id = Number(req.query.empleado_id);
    if (req.query.sucursal_id) where.sucursal_id = Number(req.query.sucursal_id);
    if (req.query.periodo) where.periodo = Number(req.query.periodo);
    if (req.query.desde || req.query.hasta) {
      // filtro por rango dentro de [fecha_desde, fecha_hasta]
      const desde = req.query.desde ? new Date(req.query.desde) : null;
      const hasta = req.query.hasta ? new Date(req.query.hasta) : null;
      if (desde || hasta) {
        where[Op.or] = [
          // fecha_desde dentro del rango
          { fecha_desde: { ...(desde && { [Op.gte]: desde }), ...(hasta && { [Op.lte]: hasta }) } },
          // fecha_hasta dentro del rango
          { fecha_hasta: { ...(desde && { [Op.gte]: desde }), ...(hasta && { [Op.lte]: hasta }) } },
        ];
      }
    }

    const { rows, count } = await AsignacionVacaciones.findAndCountAll({
      where,
      order: [["id", "DESC"]],
      limit, offset,
    });
    return res.status(200).json({ items: rows, page, limit, total: count });
  } catch (e) {
    console.error("❌ listarAsignacionesVacaciones:", e);
    return res.status(500).json({ error: "Error al listar asignaciones", detalle: e.message });
  }
};

export const obtenerAsignacionVacacionesPorId = async (req, res) => {
  try {
    const row = await AsignacionVacaciones.findByPk(req.params.id);
    if (!row) return res.status(404).json({ error: "Asignación no encontrada" });
    return res.status(200).json(row);
  } catch (e) {
    console.error("❌ obtenerAsignacionVacacionesPorId:", e);
    return res.status(500).json({ error: "Error al obtener la asignación" });
  }
};

export const actualizarAsignacionVacaciones = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const err = validar({ ...req.body, empleado_id: req.body.empleado_id ?? 1 }); // fuerza validaciones básicas
    if (err) { await t.rollback(); return res.status(400).json({ error: err }); }

    const row = await AsignacionVacaciones.findByPk(req.params.id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!row) { await t.rollback(); return res.status(404).json({ error: "Asignación no encontrada" }); }

    await row.update(req.body, { transaction: t });
    await t.commit();
    return res.status(200).json(row);
  } catch (e) {
    await t.rollback();
    console.error("❌ actualizarAsignacionVacaciones:", e);
    return res.status(500).json({ error: "Error al actualizar la asignación", detalle: e.message });
  }
};

export const eliminarAsignacionVacaciones = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const row = await AsignacionVacaciones.findByPk(req.params.id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!row) { await t.rollback(); return res.status(404).json({ error: "Asignación no encontrada" }); }
    await row.destroy({ transaction: t });
    await t.commit();
    return res.status(200).json({ mensaje: "Asignación eliminada correctamente" });
  } catch (e) {
    await t.rollback();
    console.error("❌ eliminarAsignacionVacaciones:", e);
    return res.status(500).json({ error: "Error al eliminar la asignación", detalle: e.message });
  }
};

// GET /asignacionesvacaciones/status/:empleado_id/:periodo
export const getVacationStatus = async (req, res) => {
  const { empleado_id, periodo } = req.params;
  try {
    const asignacion = await AsignacionVacaciones.findOne({
      where: { empleado_id, periodo }
    });

    if (!asignacion) {
      return res.json({
        total_days_assigned: 0,
        total_days_taken: 0,
        remaining_days: 0
      });
    }

    const vacacionesTomadas = await AsignacionVacaciones.findAll({ 
      where: {
        empleado_id,
        periodo,
        fecha_desde: { [Op.not]: null },
        fecha_hasta: { [Op.not]: null }
      }
    });

    let total_days_taken = 0;
    for (const v of vacacionesTomadas) {
      const desde = new Date(v.fecha_desde);
      const hasta = new Date(v.fecha_hasta);
      const days = Math.ceil((hasta - desde) / (1000 * 60 * 60 * 24)) + 1;
      total_days_taken += days;
    }

    const remaining_days = asignacion.dias_vacaciones - total_days_taken;

    return res.json({
      total_days_assigned: asignacion.dias_vacaciones,
      total_days_taken,
      remaining_days
    });
  } catch (e) {
    console.error("❌ getVacationStatus:", e);
    res.status(500).json({ error: "Error al calcular el estado de vacaciones" });
  }
};

// GET /asignacionesvacaciones/interval/:start_date/:end_date
// o /asignacionesvacaciones/interval/:start_date/:end_date/:sucursal_id
export const getVacationsInInterval = async (req, res) => {
  try {
    const { start_date, end_date, sucursal_id } = req.params;
    const where = {
      fecha_desde: { [Op.lte]: end_date },
      fecha_hasta: { [Op.gte]: start_date },
    };
    if (sucursal_id) where.sucursal_id = Number(sucursal_id);

    const rows = await AsignacionVacaciones.findAll({ where });
    return res.json(rows);
  } catch (e) {
    console.error("❌ getVacationsInInterval:", e);
    res.status(500).json({ error: "Error al obtener vacaciones en el intervalo" });
  }
};


// GET /asignacionesvacaciones/employee/:empleado_id
export const getEmployeeVacations = async (req, res) => {
  try {
    const { empleado_id } = req.params;
    const rows = await AsignacionVacaciones.findAll({ where: { empleado_id } });
    return res.json(rows);
  } catch (e) {
    console.error("❌ getEmployeeVacations:", e);
    res.status(500).json({ error: "Error al obtener vacaciones del empleado" });
  }
};


