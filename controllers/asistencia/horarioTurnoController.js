import { sequelize } from "../../config/database.js";
import HorarioTurno from "../../models/asistencia/HorarioTurno.js";

const toMinutes = (hhmm) => {
  if (!hhmm) return null;
  const [h, m] = String(hhmm).split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
};

const validar = (body) => {
  const { inicio_am, fin_am, inicio_pm, fin_pm } = body || {};
  const am_i = toMinutes(inicio_am), am_f = toMinutes(fin_am);
  const pm_i = toMinutes(inicio_pm), pm_f = toMinutes(fin_pm);
  if (am_i != null && am_f != null && am_i >= am_f) return "Rango AM inválido (inicio debe ser < fin).";
  if (pm_i != null && pm_f != null && pm_i >= pm_f) return "Rango PM inválido (inicio debe ser < fin).";
  return null;
};

export const crearHorarioTurno = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const err = validar(req.body);
    if (err) { await t.rollback(); return res.status(400).json({ error: err }); }
    const row = await HorarioTurno.create(req.body, { transaction: t });
    await t.commit();
    return res.status(201).json(row);
  } catch (e) {
    await t.rollback();
    console.error("❌ crearHorarioTurno:", e);
    return res.status(500).json({ error: "Error al crear horario", detalle: e.message });
  }
};

export const listarHorariosTurno = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(1000, Math.max(1, Number(req.query.limit) || 50));
    const offset = (page - 1) * limit;

    const { rows, count } = await HorarioTurno.findAndCountAll({
      order: [["id", "DESC"]],
      limit, offset,
    });
    return res.status(200).json({ items: rows, page, limit, total: count });
  } catch (e) {
    console.error("❌ listarHorariosTurno:", e);
    return res.status(500).json({ error: "Error al listar horarios", detalle: e.message });
  }
};

export const obtenerHorarioTurnoPorId = async (req, res) => {
  try {
    const row = await HorarioTurno.findByPk(req.params.id);
    if (!row) return res.status(404).json({ error: "Horario no encontrado" });
    return res.status(200).json(row);
  } catch (e) {
    console.error("❌ obtenerHorarioTurnoPorId:", e);
    return res.status(500).json({ error: "Error al obtener el horario" });
  }
};

export const actualizarHorarioTurno = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const err = validar(req.body);
    if (err) { await t.rollback(); return res.status(400).json({ error: err }); }

    const row = await HorarioTurno.findByPk(req.params.id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!row) { await t.rollback(); return res.status(404).json({ error: "Horario no encontrado" }); }

    await row.update(req.body, { transaction: t });
    await t.commit();
    return res.status(200).json(row);
  } catch (e) {
    await t.rollback();
    console.error("❌ actualizarHorarioTurno:", e);
    return res.status(500).json({ error: "Error al actualizar el horario", detalle: e.message });
  }
};

export const eliminarHorarioTurno = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const row = await HorarioTurno.findByPk(req.params.id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!row) { await t.rollback(); return res.status(404).json({ error: "Horario no encontrado" }); }
    await row.destroy({ transaction: t });
    await t.commit();
    return res.status(200).json({ mensaje: "Horario eliminado correctamente" });
  } catch (e) {
    await t.rollback();
    console.error("❌ eliminarHorarioTurno:", e);
    return res.status(500).json({ error: "Error al eliminar el horario", detalle: e.message });
  }
};
