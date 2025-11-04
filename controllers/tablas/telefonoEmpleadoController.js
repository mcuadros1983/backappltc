// src/controllers/telefonoEmpleado.controller.js
import TelefonoEmpleado from "../../models/tablas/telefonoEmpleado.js";
import EmpleadoTabla from "../../models/tablas/empleadoModel.js";
import { Op } from "sequelize";

/**
 * Validación básica del número
 */
function validarNumero(numero) {
  if (typeof numero !== "string") return "El número debe ser texto.";
  const clean = numero.trim();
  if (!clean) return "El número es obligatorio.";
  // Permite +, espacios, -, (), . y dígitos; ajustalo si querés más estricto
  if (!/^[+()\-.\s0-9]+$/.test(clean)) return "Formato de número no válido.";
  return null;
}

/**
 * GET /telefonos
 * Listado general, con filtros y paginación simple.
 * Query:
 *  - empleado_id (opcional)
 *  - q (opcional: busca por número)
 *  - limit, offset (opcionales)
 *  - order, dir (opcionales; por defecto id DESC)
 */
export async function listTelefonos(req, res) {
  try {
    const {
      empleado_id,
      q,
      limit = 50,
      offset = 0,
      order = "id",
      dir = "DESC",
    } = req.query;

    const where = {};
    if (empleado_id) where.empleado_id = Number(empleado_id);
    if (q && q.trim()) where.numero = { [Op.like]: `%${q.trim()}%` };

    const result = await TelefonoEmpleado.findAndCountAll({
      where,
      include: [{ model: EmpleadoTabla, as: "empleado" }],
      order: [[order, String(dir).toUpperCase() === "ASC" ? "ASC" : "DESC"]],
      limit: Math.min(Number(limit) || 50, 200),
      offset: Number(offset) || 0,
    });

    res.json({
      count: result.count,
      rows: result.rows,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "No se pudo listar los teléfonos." });
  }
}

/**
 * GET /telefonos/:id
 */
export async function getTelefono(req, res) {
  try {
    const { id } = req.params;
    const tel = await TelefonoEmpleado.findByPk(id, {
      include: [{ model: EmpleadoTabla, as: "empleado" }],
    });
    if (!tel) return res.status(404).json({ error: "Teléfono no encontrado." });
    res.json(tel);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "No se pudo obtener el teléfono." });
  }
}

/**
 * POST /telefonos
 * Body: { empleado_id, numero, tipo? }
 */
export async function createTelefono(req, res) {
  try {
    const { empleado_id, numero, tipo = null } = req.body || {};

    if (!empleado_id) {
      return res.status(400).json({ error: "empleado_id es obligatorio." });
    }
    const errNum = validarNumero(numero);
    if (errNum) return res.status(400).json({ error: errNum });

    // Verificar que el empleado exista
    const emp = await EmpleadoTabla.findByPk(empleado_id);
    if (!emp) return res.status(400).json({ error: "Empleado no existe." });

    const nuevo = await TelefonoEmpleado.create({
      empleado_id,
      numero: numero.trim(),
      tipo: tipo || null,
    });

    res.json(nuevo);
  } catch (e) {
    console.error(e);
    res.status(400).json({ error: e.message || "No se pudo crear el teléfono." });
  }
}

/**
 * PUT /telefonos/:id
 * Body: { numero?, tipo? }
 */
export async function updateTelefono(req, res) {
  try {
    const { id } = req.params;
    const tel = await TelefonoEmpleado.findByPk(id);
    if (!tel) return res.status(404).json({ error: "Teléfono no encontrado." });

    const patch = {};
    if (typeof req.body.numero !== "undefined") {
      const errNum = validarNumero(req.body.numero);
      if (errNum) return res.status(400).json({ error: errNum });
      patch.numero = req.body.numero.trim();
    }
    if (typeof req.body.tipo !== "undefined") {
      patch.tipo = req.body.tipo || null; // debe coincidir con ENUM si lo usás
    }

    await tel.update(patch);
    res.json(tel);
  } catch (e) {
    console.error(e);
    res.status(400).json({ error: e.message || "No se pudo actualizar el teléfono." });
  }
}

/**
 * DELETE /telefonos/:id
 */
export async function deleteTelefono(req, res) {
  try {
    const { id } = req.params;
    const tel = await TelefonoEmpleado.findByPk(id);
    if (!tel) return res.status(404).json({ error: "Teléfono no encontrado." });

    await tel.destroy();
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "No se pudo eliminar el teléfono." });
  }
}

/**
 * GET /empleados/:empleado_id/telefonos
 * Lista teléfonos de un empleado puntual (atajo útil).
 */
export async function listTelefonosPorEmpleado(req, res) {
  try {
    const { empleado_id } = req.params;
    const rows = await TelefonoEmpleado.findAll({
      where: { empleado_id: Number(empleado_id) },
      order: [["id", "ASC"]],
    });
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "No se pudo listar los teléfonos del empleado." });
  }
}

/**
 * POST /empleados/:empleado_id/telefonos
 * Crea teléfono para un empleado puntual (atajo útil).
 * Body: { numero, tipo? }
 */
export async function createTelefonoParaEmpleado(req, res) {
  try {
    const { empleado_id } = req.params;
    const { numero, tipo = null } = req.body || {};

    // Validaciones
    const emp = await EmpleadoTabla.findByPk(empleado_id);
    if (!emp) return res.status(400).json({ error: "Empleado no existe." });

    const errNum = validarNumero(numero);
    if (errNum) return res.status(400).json({ error: errNum });

    const nuevo = await TelefonoEmpleado.create({
      empleado_id: Number(empleado_id),
      numero: numero.trim(),
      tipo: tipo || null,
    });
    res.json(nuevo);
  } catch (e) {
    console.error(e);
    res.status(400).json({ error: e.message || "No se pudo crear el teléfono para el empleado." });
  }
}
