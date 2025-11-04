// server/controllers/auditoria/auditLogController.js
import { Op } from "sequelize";
import AuditLog from "../../models/auditoria/auditLogModel.js";

/* Helpers de parseo */
const N = (v) => (v === undefined || v === null || v === "" ? undefined : Number(v));
const B = (v) => {
  if (v === undefined || v === null || v === "") return undefined;
  if (typeof v === "boolean") return v;
  const s = String(v).toLowerCase();
  if (["1", "true", "t", "yes", "si", "sí", "y"].includes(s)) return true;
  if (["0", "false", "f", "no", "n"].includes(s)) return false;
  return undefined;
};
const toDateISO = (d) => {
  if (!d) return undefined;
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return undefined;
  // fecha/hora completa
  return dt.toISOString();
};

/**
 * GET /auditoria
 * Filtros soportados (query):
 * - fecha_desde, fecha_hasta  (ISO o parseables por Date)
 * - usuario_id, usuario
 * - entidad, entidad_id
 * - accion, resultado
 * - empresa_id, sucursal_id
 * - critico (true/false)
 * - q (buscador libre en: detalle, error_mensaje, ruta, metodo, user_agent, entidad, usuario)
 * - limit (por defecto 50; máx 500), offset (por defecto 0)
 * - order_by (default: fecha), order_dir (ASC|DESC; default DESC)
 */
export const listarAuditLogs = async (req, res) => {
  try {
    const {
      fecha_desde,
      fecha_hasta,
      usuario_id,
      usuario,
      entidad,
      entidad_id,
      accion,
      resultado,
      empresa_id,
      sucursal_id,
      critico,
      q,
      limit = 50,
      offset = 0,
      order_by = "fecha",
      order_dir = "DESC",
    } = req.query;

    const where = {};

    // Rango de fechas
    const fDesde = toDateISO(fecha_desde);
    const fHasta = toDateISO(fecha_hasta);
    if (fDesde || fHasta) {
      where.fecha = {};
      if (fDesde) where.fecha[Op.gte] = fDesde;
      if (fHasta) where.fecha[Op.lte] = fHasta;
    }

    // Filtros exactos
    const uid = N(usuario_id);
    if (uid !== undefined) where.usuario_id = uid;

    if (usuario) where.usuario = { [Op.iLike]: `%${usuario}%` };
    if (entidad) where.entidad = { [Op.iLike]: `%${entidad}%` };

    const eid = N(entidad_id);
    if (eid !== undefined) where.entidad_id = eid;

    if (accion) where.accion = accion;
    if (resultado) where.resultado = resultado;

    const empId = N(empresa_id);
    if (empId !== undefined) where.empresa_id = empId;

    const sucId = N(sucursal_id);
    if (sucId !== undefined) where.sucursal_id = sucId;

    const crit = B(critico);
    if (crit !== undefined) where.critico = crit;

    // Full-text simple
    if (q) {
      const term = `%${q}%`;
      where[Op.or] = [
        { detalle:       { [Op.iLike]: term } },
        { error_mensaje: { [Op.iLike]: term } },
        { ruta:          { [Op.iLike]: term } },
        { metodo:        { [Op.iLike]: term } },
        { user_agent:    { [Op.iLike]: term } },
        { entidad:       { [Op.iLike]: term } },
        { usuario:       { [Op.iLike]: term } },
      ];
    }

    // Paginación y orden
    const lim = Math.min(Math.max(Number(limit) || 50, 1), 500);
    const off = Math.max(Number(offset) || 0, 0);

    const allowedOrderBy = new Set([
      "fecha", "usuario_id", "usuario", "entidad", "entidad_id",
      "accion", "resultado", "empresa_id", "sucursal_id", "critico", "id"
    ]);
    const ob = allowedOrderBy.has(String(order_by)) ? String(order_by) : "fecha";
    const od = String(order_dir).toUpperCase() === "ASC" ? "ASC" : "DESC";

    const { rows, count } = await AuditLog.findAndCountAll({
      where,
      order: [[ob, od], ["id", "DESC"]],
      limit: lim,
      offset: off,
    });

    return res.json({
      total: count,
      limit: lim,
      offset: off,
      order_by: ob,
      order_dir: od,
      items: rows,
    });
  } catch (err) {
    console.error("❌ listarAuditLogs:", err);
    return res.status(500).json({ error: "Error al listar registros de auditoría" });
  }
};

/**
 * GET /auditoria/:id
 */
export const obtenerAuditLogPorId = async (req, res) => {
  try {
    const id = Number(req.params.id || 0);
    const row = await AuditLog.findByPk(id);
    if (!row) return res.status(404).json({ error: "Registro de auditoría no encontrado" });
    return res.json(row);
  } catch (err) {
    console.error("❌ obtenerAuditLogPorId:", err);
    return res.status(500).json({ error: "Error al obtener registro de auditoría" });
  }
};


// ...
export const purgarAuditLogs = async (req, res) => {
  try {
    const {
      fecha_desde,
      fecha_hasta,
      // filtros opcionales para acotar la purga
      entidad,
      accion,
      resultado,
      empresa_id,
      sucursal_id,
      usuario_id,
      critico, // si lo envías como true = solo críticos
      q,       // para detalle/ruta/ua, etc.
      dry_run = "0", // si "1" solo devuelve cuántos afectaría sin borrar
    } = req.body || {};

    if (!fecha_desde || !fecha_hasta) {
      return res.status(400).json({ error: "Debe indicar fecha_desde y fecha_hasta (YYYY-MM-DD o ISO)" });
    }

    const toDateISO = (d) => {
      const dt = new Date(d);
      if (Number.isNaN(dt.getTime())) return null;
      return dt.toISOString();
    };

    const fDesde = toDateISO(fecha_desde);
    const fHasta = toDateISO(fecha_hasta);
    if (!fDesde || !fHasta) {
      return res.status(400).json({ error: "Fechas inválidas" });
    }

    const where = {
      fecha: { [Op.between]: [fDesde, fHasta] },
    };

    const N = (v) => (v === undefined || v === null || v === "" ? undefined : Number(v));
    const B = (v) => {
      if (v === undefined || v === null || v === "") return undefined;
      if (typeof v === "boolean") return v;
      const s = String(v).toLowerCase();
      if (["1", "true", "t", "yes", "si", "sí"].includes(s)) return true;
      if (["0", "false", "f", "no"].includes(s)) return false;
      return undefined;
    };

    if (entidad) where.entidad = { [Op.iLike]: `%${entidad}%` };
    if (accion) where.accion = accion;
    if (resultado) where.resultado = resultado;

    const empId = N(empresa_id);
    if (empId !== undefined) where.empresa_id = empId;

    const sucId = N(sucursal_id);
    if (sucId !== undefined) where.sucursal_id = sucId;

    const uid = N(usuario_id);
    if (uid !== undefined) where.usuario_id = uid;

    const crit = B(critico);
    if (crit !== undefined) where.critico = crit;

    if (q) {
      const term = `%${q}%`;
      where[Op.or] = [
        { detalle:       { [Op.iLike]: term } },
        { error_mensaje: { [Op.iLike]: term } },
        { ruta:          { [Op.iLike]: term } },
        { user_agent:    { [Op.iLike]: term } },
        { metodo:        { [Op.iLike]: term } },
        { entidad:       { [Op.iLike]: term } },
        { usuario:       { [Op.iLike]: term } },
      ];
    }

    // Dry-run: contar cuántos serían
    const count = await AuditLog.count({ where });

    if (String(dry_run) === "1") {
      return res.json({ dry_run: true, would_delete: count });
    }

    // Eliminar
    const deleted = await AuditLog.destroy({ where });
    return res.json({ deleted, rango: { desde: fDesde, hasta: fHasta } });
  } catch (err) {
    console.error("❌ purgarAuditLogs:", err);
    return res.status(500).json({ error: "Error al purgar registros de auditoría" });
  }
};
