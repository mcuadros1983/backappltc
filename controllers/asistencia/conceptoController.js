import { sequelize } from "../../config/database.js";
import { Op } from "sequelize";
import Concepto from "../../models/asistencia/Concepto.js";

const validar = (body) => {
  const { nombre, codigo } = body || {};
  if (!nombre || !String(nombre).trim()) return "El nombre es requerido.";
  if (!codigo || !String(codigo).trim()) return "El código es requerido.";
  return null;
};

export const crearConcepto = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const err = validar(req.body);
    if (err) { await t.rollback(); return res.status(400).json({ error: err }); }

    const row = await Concepto.create(req.body, { transaction: t });
    await t.commit();
    return res.status(201).json(row);
  } catch (e) {
    await t.rollback();
    if (e?.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({ error: "Nombre o código ya existe." });
    }
    console.error("❌ crearConcepto:", e);
    return res.status(500).json({ error: "Error al crear concepto", detalle: e.message });
  }
};

export const listarConceptos = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(1000, Math.max(1, Number(req.query.limit) || 50));
    const offset = (page - 1) * limit;

    const where = {};
    const q = (req.query.q || "").trim();
    if (q) {
      where[Op.or] = [
        { nombre: { [Op.iLike]: `%${q}%` } },
        { codigo: { [Op.iLike]: `%${q}%` } },
      ];
    }

    const { rows, count } = await Concepto.findAndCountAll({
      where,
      order: [["id", "DESC"]],
      limit, offset,
    });
    return res.status(200).json({ items: rows, page, limit, total: count });
  } catch (e) {
    console.error("❌ listarConceptos:", e);
    return res.status(500).json({ error: "Error al listar conceptos", detalle: e.message });
  }
};

export const obtenerConceptoPorId = async (req, res) => {
  try {
    const row = await Concepto.findByPk(req.params.id);
    if (!row) return res.status(404).json({ error: "Concepto no encontrado" });
    return res.status(200).json(row);
  } catch (e) {
    console.error("❌ obtenerConceptoPorId:", e);
    return res.status(500).json({ error: "Error al obtener concepto" });
  }
};

export const actualizarConcepto = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const err = validar({ ...req.body, nombre: req.body?.nombre ?? "x", codigo: req.body?.codigo ?? "x" });
    if (err) { await t.rollback(); return res.status(400).json({ error: err }); }

    const row = await Concepto.findByPk(req.params.id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!row) { await t.rollback(); return res.status(404).json({ error: "Concepto no encontrado" }); }

    await row.update(req.body, { transaction: t });
    await t.commit();
    return res.status(200).json(row);
  } catch (e) {
    await t.rollback();
    if (e?.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({ error: "Nombre o código ya existe." });
    }
    console.error("❌ actualizarConcepto:", e);
    return res.status(500).json({ error: "Error al actualizar concepto", detalle: e.message });
  }
};

export const eliminarConcepto = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const row = await Concepto.findByPk(req.params.id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!row) { await t.rollback(); return res.status(404).json({ error: "Concepto no encontrado" }); }

    await row.destroy({ transaction: t });
    await t.commit();
    return res.status(200).json({ mensaje: "Concepto eliminado correctamente" });
  } catch (e) {
    await t.rollback();
    console.error("❌ eliminarConcepto:", e);
    return res.status(500).json({ error: "Error al eliminar concepto", detalle: e.message });
  }
};
