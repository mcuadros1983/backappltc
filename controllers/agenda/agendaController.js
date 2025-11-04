// import { Op } from "sequelize";
// import { sequelize } from "../../config/database.js";
// import Agenda from "../../models/agenda/registroAgendaModel.js";

// /* =========================
//    Helpers de fechas/recurrencia
//    ========================= */

// function toDateOnly(d) {
//   // Asegura YYYY-MM-DD
//   return new Date(d).toISOString().slice(0, 10);
// }

// function addDays(dateStr, days) {
//   const d = new Date(dateStr);
//   d.setDate(d.getDate() + Number(days || 0));
//   return toDateOnly(d);
// }

// function addMonths(dateStr, months) {
//   const d = new Date(dateStr);
//   d.setMonth(d.getMonth() + Number(months || 0));
//   return toDateOnly(d);
// }
// function addYears(dateStr, years) {
//   const d = new Date(dateStr);
//   d.setFullYear(d.getFullYear() + Number(years || 0));
//   return toDateOnly(d);
// }

// function clampDay(year, month, dia) {
//   // Ajusta el día a la cantidad de días del mes (28-31)
//   const lastDay = new Date(year, month + 1, 0).getDate();
//   return Math.min(Math.max(dia, 1), lastDay);
// }

// /**
//  * Calcula la próxima fecha_vencimiento a partir de:
//  * - fecha base (fecha)
//  * - periodicidad (unica/diaria/semanal/mensual/anual)
//  * - repetir_cada
//  * - dia_vencimiento (si aplica)
//  * - fecha_vencimiento (puede venir seteada; si no, se calcula)
//  * - repetir_hasta (si existe, no generar más allá)
//  */
// export function calcularProximoVencimiento({
//   fecha,
//   fecha_vencimiento,
//   periodicidad = "unica",
//   repetir_cada = 1,
//   dia_vencimiento = null,
//   repetir_hasta = null,
// }) {
//   // Si ya viene una fecha_vencimiento explícita, la respetamos
//   if (fecha_vencimiento) {
//     return toDateOnly(fecha_vencimiento);
//   }

//   const base = toDateOnly(fecha || new Date());
//   let next = base;

//   switch (periodicidad) {
//     case "unica":
//       // Si no vino fecha_vencimiento, usamos fecha como vencimiento
//       next = base;
//       break;

//     case "diaria":
//       next = addDays(base, repetir_cada);
//       break;

//     case "semanal":
//       next = addDays(base, 7 * repetir_cada);
//       break;

//     case "mensual": {
//       // Si hay dia_vencimiento, se fuerza ese día del mes
//       const b = new Date(base);
//       const y = b.getFullYear();
//       const m = b.getMonth(); // 0-11
//       const targetMonth = m + Number(repetir_cada || 1);
//       const d = dia_vencimiento
//         ? clampDay(y, targetMonth, Number(dia_vencimiento))
//         : b.getDate();
//       const tmp = new Date(y, targetMonth, d);
//       next = toDateOnly(tmp);
//       break;
//     }

//     case "anual": {
//       const b = new Date(base);
//       const y = b.getFullYear();
//       const m = b.getMonth();
//       const d = dia_vencimiento ? clampDay(y + Number(repetir_cada || 1), m, Number(dia_vencimiento)) : b.getDate();
//       const tmp = new Date(y + Number(repetir_cada || 1), m, d);
//       next = toDateOnly(tmp);
//       break;
//     }

//     default:
//       next = base;
//   }

//   // Respetar repetir_hasta si existe
//   if (repetir_hasta && next > toDateOnly(repetir_hasta)) {
//     return null; // ya no corresponde generar vencimiento nuevo
//   }

//   return next;
// }

// /* =========================
//    Normalización del payload
//    ========================= */
// function normalizarPayload(body) {
//   const out = { ...body };

//   // Numeric conversions
//   if (out.costo != null) out.costo = Number(out.costo);
//   if (out.repetir_cada != null) out.repetir_cada = Number(out.repetir_cada) || 1;
//   if (out.dia_vencimiento != null) out.dia_vencimiento = Number(out.dia_vencimiento) || null;
//   if (out.recordatorio_dias_antes != null) out.recordatorio_dias_antes = Number(out.recordatorio_dias_antes) || null;

//   // Dates
//   if (out.fecha) out.fecha = toDateOnly(out.fecha);
//   if (out.fecha_vencimiento) out.fecha_vencimiento = toDateOnly(out.fecha_vencimiento);
//   if (out.repetir_hasta) out.repetir_hasta = toDateOnly(out.repetir_hasta);

//   // Enums: asegurar valores válidos (dejamos validación final a Sequelize también)
//   const IMPORT = ["baja", "media", "alta", "critica"];
//   if (out.importancia && !IMPORT.includes(out.importancia)) out.importancia = "media";

//   const EST = ["pendiente", "parcial", "realizado", "postergado"];
//   if (out.realizado && !EST.includes(out.realizado)) out.realizado = "pendiente";

//   const PER = ["unica", "diaria", "semanal", "mensual", "anual"];
//   if (out.periodicidad && !PER.includes(out.periodicidad)) out.periodicidad = "unica";

//   // Si no viene fecha_vencimiento y la periodicidad no es "unica", la calculamos
//   if (!out.fecha_vencimiento) {
//     out.fecha_vencimiento = calcularProximoVencimiento({
//       fecha: out.fecha,
//       fecha_vencimiento: out.fecha_vencimiento,
//       periodicidad: out.periodicidad,
//       repetir_cada: out.repetir_cada,
//       dia_vencimiento: out.dia_vencimiento,
//       repetir_hasta: out.repetir_hasta,
//     });
//   }

//   return out;
// }

// /* =========================
//    Controllers
//    ========================= */

// // POST /agenda
// export const crearAgenda = async (req, res) => {
//   const t = await sequelize.transaction();
//   try {
//     const payload = normalizarPayload(req.body);
//     if (!payload.titulo) throw new Error("titulo requerido");
//     if (!payload.fecha) throw new Error("fecha requerida");

//     const item = await Agenda.create(payload, { transaction: t });
//     await t.commit();
//     return res.status(201).json(item);
//   } catch (err) {
//     await t.rollback();
//     console.error("❌ crearAgenda:", err);
//     return res.status(400).json({ error: err.message || "No se pudo crear la agenda" });
//   }
// };

// // controllers/agenda/agendaController.js
// export const listarAgenda = async (req, res) => {
//   try {
//     const {
//       empresa_id, sucursal_id, importancia, realizado, periodicidad,
//       fecha_desde, fecha_hasta,
//       fecha_campo,                 // <-- NUEVO: "fecha" | "fecha_vencimiento"
//       q, limit = 100, offset = 0,
//       incluir_anulados, anulado,
//     } = req.query;

//     const where = {};

//     // anulados (como antes)
//     if (typeof anulado !== "undefined") {
//       where.anulado = String(anulado) === "true";
//     } else if (!incluir_anulados || String(incluir_anulados) !== "true") {
//       where.anulado = false;
//     }

//     if (empresa_id) where.empresa_id = Number(empresa_id);
//     if (sucursal_id) where.sucursal_id = Number(sucursal_id);
//     if (importancia) where.importancia = importancia;
//     if (realizado) where.realizado = realizado;
//     if (periodicidad) where.periodicidad = periodicidad;

//     // <- AQUÍ el cambio
//     const campoFecha = (fecha_campo === "fecha") ? "fecha" : "fecha_vencimiento";
//     if (fecha_desde || fecha_hasta) {
//       where[campoFecha] = {};
//       if (fecha_desde) where[campoFecha][Op.gte] = fecha_desde;
//       if (fecha_hasta) where[campoFecha][Op.lte] = fecha_hasta;
//     }

//     if (q) {
//       where[Op.or] = [
//         { titulo: { [Op.iLike]: `%${q}%` } },
//         { descripcion: { [Op.iLike]: `%${q}%` } },
//         { observaciones: { [Op.iLike]: `%${q}%` } },
//       ];
//     }

//     const rows = await Agenda.findAll({
//       where,
//       order: [[campoFecha, "ASC"], ["id", "ASC"]],
//       limit: Number(limit),
//       offset: Number(offset),
//     });

//     return res.json(rows);
//   } catch (err) {
//     console.error("❌ listarAgenda:", err);
//     return res.status(400).json({ error: "No se pudo listar la agenda" });
//   }
// };

// // GET /agenda/:id
// export const obtenerAgenda = async (req, res) => {
//   try {
//     const id = Number(req.params.id || 0);
//     const item = await Agenda.findByPk(id);
//     if (!item) return res.status(404).json({ error: "Agenda no encontrada" });
//     return res.json(item);
//   } catch (err) {
//     console.error("❌ obtenerAgenda:", err);
//     return res.status(400).json({ error: "No se pudo obtener agenda" });
//   }
// };

// // PUT /agenda/:id
// export const actualizarAgenda = async (req, res) => {
//   const t = await sequelize.transaction();
//   try {
//     const id = Number(req.params.id || 0);
//     const item = await Agenda.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE });
//     if (!item) {
//       await t.rollback();
//       return res.status(404).json({ error: "Agenda no encontrada" });
//     }

//     // Normalizamos el payload y recalculamos fecha_vencimiento si cambia algo clave
//     const payload = normalizarPayload(req.body);
//     await item.update(payload, { transaction: t });

//     await t.commit();
//     return res.json(item);
//   } catch (err) {
//     await t.rollback();
//     console.error("❌ actualizarAgenda:", err);
//     return res.status(400).json({ error: err.message || "No se pudo actualizar agenda" });
//   }
// };

// // PATCH /agenda/:id/estado  { realizado: 'pendiente|parcial|realizado|postergado' }
// export const cambiarEstadoAgenda = async (req, res) => {
//   const t = await sequelize.transaction();
//   try {
//     const id = Number(req.params.id || 0);
//     const { realizado } = req.body || {};
//     const EST = ["pendiente", "parcial", "realizado", "postergado"];
//     if (!EST.includes(realizado)) throw new Error("Estado inválido");

//     const item = await Agenda.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE });
//     if (!item) {
//       await t.rollback();
//       return res.status(404).json({ error: "Agenda no encontrada" });
//     }

//     await item.update({ realizado }, { transaction: t });
//     await t.commit();
//     return res.json(item);
//   } catch (err) {
//     await t.rollback();
//     console.error("❌ cambiarEstadoAgenda:", err);
//     return res.status(400).json({ error: err.message || "No se pudo cambiar el estado" });
//   }
// };

// // POST /agenda/:id/postergar  { dias?: number }  ó  { a_proxima_ocurrencia: true }
// export const postergarAgenda = async (req, res) => {
//   const t = await sequelize.transaction();
//   try {
//     const id = Number(req.params.id || 0);
//     const { dias, a_proxima_ocurrencia } = req.body || {};

//     const item = await Agenda.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE });
//     if (!item) {
//       await t.rollback();
//       return res.status(404).json({ error: "Agenda no encontrada" });
//     }

//     let nuevaFechaVto = item.fecha_vencimiento || item.fecha;

//     if (a_proxima_ocurrencia) {
//       const next = calcularProximoVencimiento({
//         fecha: item.fecha_vencimiento || item.fecha,
//         periodicidad: item.periodicidad,
//         repetir_cada: item.repetir_cada,
//         dia_vencimiento: item.dia_vencimiento,
//         repetir_hasta: item.repetir_hasta,
//       });
//       if (!next) throw new Error("No hay próxima ocurrencia (repetir_hasta alcanzado o configuración inválida)");
//       nuevaFechaVto = next;
//     } else {
//       // Por defecto, sumar días
//       const nd = Number(dias || 0);
//       if (!nd) throw new Error("Debes indicar 'dias' o 'a_proxima_ocurrencia'");
//       nuevaFechaVto = addDays(nuevaFechaVto, nd);
//     }

//     await item.update({ fecha_vencimiento: nuevaFechaVto, realizado: "postergado" }, { transaction: t });
//     await t.commit();
//     return res.json(item);
//   } catch (err) {
//     await t.rollback();
//     console.error("❌ postergarAgenda:", err);
//     return res.status(400).json({ error: err.message || "No se pudo postergar" });
//   }
// };

// // GET /agenda/proximos?vencen_en_dias=7&empresa_id=..&sucursal_id=..
// export const proximosVencimientos = async (req, res) => {
//   try {
//     const { vencen_en_dias = 7, empresa_id, sucursal_id } = req.query;
//     const hoy = toDateOnly(new Date());
//     const hasta = addDays(hoy, Number(vencen_en_dias));

//     const where = {
//       anulado: false,
//       realizado: { [Op.in]: ["pendiente", "parcial", "postergado"] },
//       fecha_vencimiento: { [Op.gte]: hoy, [Op.lte]: hasta },
//     };
//     if (empresa_id) where.empresa_id = Number(empresa_id);
//     if (sucursal_id) where.sucursal_id = Number(sucursal_id);

//     const rows = await Agenda.findAll({
//       where,
//       order: [["fecha_vencimiento", "ASC"], ["importancia", "DESC"], ["id", "ASC"]],
//       limit: 200,
//     });

//     return res.json(rows);
//   } catch (err) {
//     console.error("❌ proximosVencimientos:", err);
//     return res.status(400).json({ error: "No se pudo obtener próximos vencimientos" });
//   }
// };

// // DELETE /agenda/:id  (soft delete)
// export const eliminarAgenda = async (req, res) => {
//   const t = await sequelize.transaction();
//   try {
//     const id = Number(req.params.id || 0);
//     const item = await Agenda.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE });
//     if (!item) {
//       await t.rollback();
//       return res.status(404).json({ error: "Agenda no encontrada" });
//     }

//     await item.update({ anulado: true }, { transaction: t });
//     await t.commit();
//     return res.json({ mensaje: "Agenda anulada", id: item.id });
//   } catch (err) {
//     await t.rollback();
//     console.error("❌ eliminarAgenda:", err);
//     return res.status(400).json({ error: "No se pudo anular la agenda" });
//   }
// };

// // DELETE /agenda/:id/hard  (opcional: eliminación definitiva)
// export const eliminarAgendaHard = async (req, res) => {
//   const t = await sequelize.transaction();
//   try {
//     const id = Number(req.params.id || 0);
//     const item = await Agenda.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE });
//     if (!item) {
//       await t.rollback();
//       return res.status(404).json({ error: "Agenda no encontrada" });
//     }

//     await item.destroy({ transaction: t });
//     await t.commit();
//     return res.json({ mensaje: "Agenda eliminada definitivamente", id });
//   } catch (err) {
//     await t.rollback();
//     console.error("❌ eliminarAgendaHard:", err);
//     return res.status(400).json({ error: "No se pudo eliminar definitivamente" });
//   }
// };

//--------------------------------------------------------------------------------

// import { Op } from "sequelize";
// import { sequelize } from "../../config/database.js";
// import Agenda from "../../models/agenda/registroAgendaModel.js";
// import { logAction } from "../../utils/auditLogger.js";
// import { withCtx } from "../../utils/auditOptions.js";
// /* =========================
//    Helpers de fechas/recurrencia
//    ========================= */

// function toDateOnly(d) {
//   // Asegura YYYY-MM-DD
//   return new Date(d).toISOString().slice(0, 10);
// }

// function addDays(dateStr, days) {
//   const d = new Date(dateStr);
//   d.setDate(d.getDate() + Number(days || 0));
//   return toDateOnly(d);
// }

// function addMonths(dateStr, months) {
//   const d = new Date(dateStr);
//   d.setMonth(d.getMonth() + Number(months || 0));
//   return toDateOnly(d);
// }
// function addYears(dateStr, years) {
//   const d = new Date(dateStr);
//   d.setFullYear(d.getFullYear() + Number(years || 0));
//   return toDateOnly(d);
// }

// function clampDay(year, month, dia) {
//   // Ajusta el día a la cantidad de días del mes (28-31)
//   const lastDay = new Date(year, month + 1, 0).getDate();
//   return Math.min(Math.max(dia, 1), lastDay);
// }

// /**
//  * Calcula la próxima fecha_vencimiento a partir de:
//  * - fecha base (fecha)
//  * - periodicidad (unica/diaria/semanal/mensual/anual)
//  * - repetir_cada
//  * - dia_vencimiento (si aplica)
//  * - fecha_vencimiento (puede venir seteada; si no, se calcula)
//  * - repetir_hasta (si existe, no generar más allá)
//  */
// export function calcularProximoVencimiento({
//   fecha,
//   fecha_vencimiento,
//   periodicidad = "unica",
//   repetir_cada = 1,
//   dia_vencimiento = null,
//   repetir_hasta = null,
// }) {
//   // Si ya viene una fecha_vencimiento explícita, la respetamos
//   if (fecha_vencimiento) {
//     return toDateOnly(fecha_vencimiento);
//   }

//   const base = toDateOnly(fecha || new Date());
//   let next = base;

//   switch (periodicidad) {
//     case "unica":
//       next = base;
//       break;

//     case "diaria":
//       next = addDays(base, repetir_cada);
//       break;

//     case "semanal":
//       next = addDays(base, 7 * repetir_cada);
//       break;

//     case "mensual": {
//       const b = new Date(base);
//       const y = b.getFullYear();
//       const m = b.getMonth(); // 0-11
//       const targetMonth = m + Number(repetir_cada || 1);
//       const d = dia_vencimiento
//         ? clampDay(y, targetMonth, Number(dia_vencimiento))
//         : b.getDate();
//       const tmp = new Date(y, targetMonth, d);
//       next = toDateOnly(tmp);
//       break;
//     }

//     case "anual": {
//       const b = new Date(base);
//       const y = b.getFullYear();
//       const m = b.getMonth();
//       const d = dia_vencimiento
//         ? clampDay(y + Number(repetir_cada || 1), m, Number(dia_vencimiento))
//         : b.getDate();
//       const tmp = new Date(y + Number(repetir_cada || 1), m, d);
//       next = toDateOnly(tmp);
//       break;
//     }

//     default:
//       next = base;
//   }

//   if (repetir_hasta && next > toDateOnly(repetir_hasta)) {
//     return null;
//   }
//   return next;
// }

// /* =========================
//    Normalización del payload
//    ========================= */
// function normalizarPayload(body) {
//   const out = { ...body };

//   // Numeric conversions
//   if (out.costo != null) out.costo = Number(out.costo);
//   if (out.repetir_cada != null) out.repetir_cada = Number(out.repetir_cada) || 1;
//   if (out.dia_vencimiento != null) out.dia_vencimiento = Number(out.dia_vencimiento) || null;
//   if (out.recordatorio_dias_antes != null) out.recordatorio_dias_antes = Number(out.recordatorio_dias_antes) || null;

//   // Dates
//   if (out.fecha) out.fecha = toDateOnly(out.fecha);
//   if (out.fecha_vencimiento) out.fecha_vencimiento = toDateOnly(out.fecha_vencimiento);
//   if (out.repetir_hasta) out.repetir_hasta = toDateOnly(out.repetir_hasta);

//   // Enums
//   const IMPORT = ["baja", "media", "alta", "critica"];
//   if (out.importancia && !IMPORT.includes(out.importancia)) out.importancia = "media";

//   const EST = ["pendiente", "parcial", "realizado", "postergado"];
//   if (out.realizado && !EST.includes(out.realizado)) out.realizado = "pendiente";

//   const PER = ["unica", "diaria", "semanal", "mensual", "anual"];
//   if (out.periodicidad && !PER.includes(out.periodicidad)) out.periodicidad = "unica";

//   // Si no viene fecha_vencimiento y la periodicidad no es "unica", la calculamos
//   if (!out.fecha_vencimiento) {
//     out.fecha_vencimiento = calcularProximoVencimiento({
//       fecha: out.fecha,
//       fecha_vencimiento: out.fecha_vencimiento,
//       periodicidad: out.periodicidad,
//       repetir_cada: out.repetir_cada,
//       dia_vencimiento: out.dia_vencimiento,
//       repetir_hasta: out.repetir_hasta,
//     });
//   }

//   return out;
// }

/* =========================
   Controllers (con logging manual)
   ========================= */

// POST /agenda
// export const crearAgenda = async (req, res) => {
//   const t = await sequelize.transaction();
//   try {
//     const payload = normalizarPayload(req.body);
//     if (!payload.titulo) throw new Error("titulo requerido");
//     if (!payload.fecha) throw new Error("fecha requerida");

//     const item = await Agenda.create(payload, { transaction: t });
//     await t.commit();

//     // LOG OK
//     await logAction(req, {
//       entidad: "Agenda",
//       entidad_id: item.id,
//       accion: "create",
//       resultado: "success",
//       empresa_id: item.empresa_id ?? null,
//       sucursal_id: item.sucursal_id ?? null,
//       new_values: item.toJSON(),
//       detalle: `Agenda creada: ${item.titulo}`,
//     });

//     return res.status(201).json(item);
//   } catch (err) {
//     await t.rollback();
//     console.error("❌ crearAgenda:", err);

//     // LOG FAIL
//     await logAction(req, {
//       entidad: "Agenda",
//       accion: "create",
//       resultado: "fail",
//       error_mensaje: err.message,
//       detalle: "Fallo al crear Agenda",
//       critico: true,
//     });

//     return res.status(400).json({ error: err.message || "No se pudo crear la agenda" });
//   }
// };

// // GET /agenda
// export const listarAgenda = async (req, res) => {
//   try {
//     const {
//       empresa_id, sucursal_id, importancia, realizado, periodicidad,
//       fecha_desde, fecha_hasta,
//       fecha_campo,                 // "fecha" | "fecha_vencimiento"
//       q, limit = 100, offset = 0,
//       incluir_anulados, anulado,
//     } = req.query;

//     const where = {};

//     // anulados
//     if (typeof anulado !== "undefined") {
//       where.anulado = String(anulado) === "true";
//     } else if (!incluir_anulados || String(incluir_anulados) !== "true") {
//       where.anulado = false;
//     }

//     if (empresa_id) where.empresa_id = Number(empresa_id);
//     if (sucursal_id) where.sucursal_id = Number(sucursal_id);
//     if (importancia) where.importancia = importancia;
//     if (realizado) where.realizado = realizado;
//     if (periodicidad) where.periodicidad = periodicidad;

//     const campoFecha = (fecha_campo === "fecha") ? "fecha" : "fecha_vencimiento";
//     if (fecha_desde || fecha_hasta) {
//       where[campoFecha] = {};
//       if (fecha_desde) where[campoFecha][Op.gte] = fecha_desde;
//       if (fecha_hasta) where[campoFecha][Op.lte] = fecha_hasta;
//     }

//     if (q) {
//       where[Op.or] = [
//         { titulo: { [Op.iLike]: `%${q}%` } },
//         { descripcion: { [Op.iLike]: `%${q}%` } },
//         { observaciones: { [Op.iLike]: `%${q}%` } },
//       ];
//     }

//     const rows = await Agenda.findAll({
//       where,
//       order: [[campoFecha, "ASC"], ["id", "ASC"]],
//       limit: Number(limit),
//       offset: Number(offset),
//     });

//     // (opcional) LOG READ (no crítico)
//     await logAction(req, {
//       entidad: "Agenda",
//       accion: "read",
//       resultado: "success",
//       detalle: `Listado (${rows.length})`,
//     });

//     return res.json(rows);
//   } catch (err) {
//     console.error("❌ listarAgenda:", err);

//     await logAction(req, {
//       entidad: "Agenda",
//       accion: "read",
//       resultado: "fail",
//       error_mensaje: err.message,
//       critico: false,
//       detalle: "Fallo al listar Agenda",
//     });

//     return res.status(400).json({ error: "No se pudo listar la agenda" });
//   }
// };

// // GET /agenda/:id
// export const obtenerAgenda = async (req, res) => {
//   try {
//     const id = Number(req.params.id || 0);
//     const item = await Agenda.findByPk(id);
//     if (!item) {
//       await logAction(req, {
//         entidad: "Agenda",
//         entidad_id: id,
//         accion: "read_one",
//         resultado: "fail",
//         detalle: "Agenda no encontrada",
//       });
//       return res.status(404).json({ error: "Agenda no encontrada" });
//     }

//     await logAction(req, {
//       entidad: "Agenda",
//       entidad_id: id,
//       accion: "read_one",
//       resultado: "success",
//     });

//     return res.json(item);
//   } catch (err) {
//     console.error("❌ obtenerAgenda:", err);

//     await logAction(req, {
//       entidad: "Agenda",
//       accion: "read_one",
//       resultado: "fail",
//       error_mensaje: err.message,
//       critico: false,
//     });

//     return res.status(400).json({ error: "No se pudo obtener agenda" });
//   }
// };

// // PUT /agenda/:id
// export const actualizarAgenda = async (req, res) => {
//   const t = await sequelize.transaction();
//   try {
//     const id = Number(req.params.id || 0);
//     const item = await Agenda.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE });
//     if (!item) {
//       await t.rollback();
//       await logAction(req, {
//         entidad: "Agenda",
//         entidad_id: id,
//         accion: "update",
//         resultado: "fail",
//         detalle: "Agenda no encontrada",
//       });
//       return res.status(404).json({ error: "Agenda no encontrada" });
//     }

//     const old = item.toJSON();
//     const payload = normalizarPayload(req.body);

//     await item.update(payload, { transaction: t });
//     await t.commit();

//     await logAction(req, {
//       entidad: "Agenda",
//       entidad_id: id,
//       accion: "update",
//       resultado: "success",
//       empresa_id: item.empresa_id ?? null,
//       sucursal_id: item.sucursal_id ?? null,
//       old_values: old,
//       new_values: item.toJSON(),
//       detalle: `Agenda actualizada: ${item.titulo}`,
//     });

//     return res.json(item);
//   } catch (err) {
//     await t.rollback();
//     console.error("❌ actualizarAgenda:", err);

//     await logAction(req, {
//       entidad: "Agenda",
//       accion: "update",
//       resultado: "fail",
//       error_mensaje: err.message,
//       critico: true,
//     });

//     return res.status(400).json({ error: err.message || "No se pudo actualizar agenda" });
//   }
// };

// // PATCH /agenda/:id/estado
// export const cambiarEstadoAgenda = async (req, res) => {
//   const t = await sequelize.transaction();
//   try {
//     const id = Number(req.params.id || 0);
//     const { realizado } = req.body || {};
//     const EST = ["pendiente", "parcial", "realizado", "postergado"];
//     if (!EST.includes(realizado)) throw new Error("Estado inválido");

//     const item = await Agenda.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE });
//     if (!item) {
//       await t.rollback();
//       await logAction(req, {
//         entidad: "Agenda",
//         entidad_id: id,
//         accion: "state_change",
//         resultado: "fail",
//         detalle: "Agenda no encontrada",
//       });
//       return res.status(404).json({ error: "Agenda no encontrada" });
//     }

//     const old = item.toJSON();
//     await item.update({ realizado }, { transaction: t });
//     await t.commit();

//     await logAction(req, {
//       entidad: "Agenda",
//       entidad_id: id,
//       accion: "state_change",
//       resultado: "success",
//       empresa_id: item.empresa_id ?? null,
//       sucursal_id: item.sucursal_id ?? null,
//       old_values: old,
//       new_values: item.toJSON(),
//       detalle: `Estado: ${old.realizado} → ${item.realizado}`,
//       critico: true,
//     });

//     return res.json(item);
//   } catch (err) {
//     await t.rollback();
//     console.error("❌ cambiarEstadoAgenda:", err);

//     await logAction(req, {
//       entidad: "Agenda",
//       accion: "state_change",
//       resultado: "fail",
//       error_mensaje: err.message,
//       critico: true,
//     });

//     return res.status(400).json({ error: err.message || "No se pudo cambiar el estado" });
//   }
// };

// // POST /agenda/:id/postergar
// export const postergarAgenda = async (req, res) => {
//   const t = await sequelize.transaction();
//   try {
//     const id = Number(req.params.id || 0);
//     const { dias, a_proxima_ocurrencia } = req.body || {};

//     const item = await Agenda.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE });
//     if (!item) {
//       await t.rollback();
//       await logAction(req, {
//         entidad: "Agenda",
//         entidad_id: id,
//         accion: "postpone",
//         resultado: "fail",
//         detalle: "Agenda no encontrada",
//       });
//       return res.status(404).json({ error: "Agenda no encontrada" });
//     }

//     const old = item.toJSON();
//     let nuevaFechaVto = item.fecha_vencimiento || item.fecha;

//     if (a_proxima_ocurrencia) {
//       const next = calcularProximoVencimiento({
//         fecha: item.fecha_vencimiento || item.fecha,
//         periodicidad: item.periodicidad,
//         repetir_cada: item.repetir_cada,
//         dia_vencimiento: item.dia_vencimiento,
//         repetir_hasta: item.repetir_hasta,
//       });
//       if (!next) throw new Error("No hay próxima ocurrencia (repetir_hasta alcanzado o configuración inválida)");
//       nuevaFechaVto = next;
//     } else {
//       const nd = Number(dias || 0);
//       if (!nd) throw new Error("Debes indicar 'dias' o 'a_proxima_ocurrencia'");
//       nuevaFechaVto = addDays(nuevaFechaVto, nd);
//     }

//     await item.update({ fecha_vencimiento: nuevaFechaVto, realizado: "postergado" }, { transaction: t });
//     await t.commit();

//     await logAction(req, {
//       entidad: "Agenda",
//       entidad_id: id,
//       accion: "postpone",
//       resultado: "success",
//       empresa_id: item.empresa_id ?? null,
//       sucursal_id: item.sucursal_id ?? null,
//       old_values: old,
//       new_values: item.toJSON(),
//       detalle: `Vencimiento: ${old.fecha_vencimiento || old.fecha} → ${item.fecha_vencimiento}`,
//       critico: true,
//     });

//     return res.json(item);
//   } catch (err) {
//     await t.rollback();
//     console.error("❌ postergarAgenda:", err);

//     await logAction(req, {
//       entidad: "Agenda",
//       accion: "postpone",
//       resultado: "fail",
//       error_mensaje: err.message,
//       critico: true,
//     });

//     return res.status(400).json({ error: err.message || "No se pudo postergar" });
//   }
// };

// // GET /agenda/proximos
// export const proximosVencimientos = async (req, res) => {
//   try {
//     const { vencen_en_dias = 7, empresa_id, sucursal_id } = req.query;
//     const hoy = toDateOnly(new Date());
//     const hasta = addDays(hoy, Number(vencen_en_dias));

//     const where = {
//       anulado: false,
//       realizado: { [Op.in]: ["pendiente", "parcial", "postergado"] },
//       fecha_vencimiento: { [Op.gte]: hoy, [Op.lte]: hasta },
//     };
//     if (empresa_id) where.empresa_id = Number(empresa_id);
//     if (sucursal_id) where.sucursal_id = Number(sucursal_id);

//     const rows = await Agenda.findAll({
//       where,
//       order: [["fecha_vencimiento", "ASC"], ["importancia", "DESC"], ["id", "ASC"]],
//       limit: 200,
//     });

//     await logAction(req, {
//       entidad: "Agenda",
//       accion: "read_upcoming",
//       resultado: "success",
//       detalle: `Próximos (${rows.length}) en ${vencen_en_dias} día(s)`,
//     });

//     return res.json(rows);
//   } catch (err) {
//     console.error("❌ proximosVencimientos:", err);

//     await logAction(req, {
//       entidad: "Agenda",
//       accion: "read_upcoming",
//       resultado: "fail",
//       error_mensaje: err.message,
//     });

//     return res.status(400).json({ error: "No se pudo obtener próximos vencimientos" });
//   }
// };

// // DELETE /agenda/:id  (soft delete)
// export const eliminarAgenda = async (req, res) => {
//   const t = await sequelize.transaction();
//   try {
//     const id = Number(req.params.id || 0);
//     const item = await Agenda.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE });
//     if (!item) {
//       await t.rollback();
//       await logAction(req, {
//         entidad: "Agenda",
//         entidad_id: id,
//         accion: "delete_soft",
//         resultado: "fail",
//         detalle: "Agenda no encontrada",
//       });
//       return res.status(404).json({ error: "Agenda no encontrada" });
//     }

//     const old = item.toJSON();
//     await item.update({ anulado: true }, { transaction: t });
//     await t.commit();

//     await logAction(req, {
//       entidad: "Agenda",
//       entidad_id: id,
//       accion: "delete_soft",
//       resultado: "success",
//       empresa_id: item.empresa_id ?? null,
//       sucursal_id: item.sucursal_id ?? null,
//       old_values: old,
//       new_values: item.toJSON(),
//       detalle: `Agenda #${id} anulada`,
//       critico: true,
//     });

//     return res.json({ mensaje: "Agenda anulada", id: item.id });
//   } catch (err) {
//     await t.rollback();
//     console.error("❌ eliminarAgenda:", err);

//     await logAction(req, {
//       entidad: "Agenda",
//       accion: "delete_soft",
//       resultado: "fail",
//       error_mensaje: err.message,
//       critico: true,
//     });

//     return res.status(400).json({ error: "No se pudo anular la agenda" });
//   }
// };

// // DELETE /agenda/:id/hard  (hard delete)
// export const eliminarAgendaHard = async (req, res) => {
//   const t = await sequelize.transaction();
//   try {
//     const id = Number(req.params.id || 0);
//     const item = await Agenda.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE });
//     if (!item) {
//       await t.rollback();
//       await logAction(req, {
//         entidad: "Agenda",
//         entidad_id: id,
//         accion: "delete_hard",
//         resultado: "fail",
//         detalle: "Agenda no encontrada",
//       });
//       return res.status(404).json({ error: "Agenda no encontrada" });
//     }

//     const snap = item.toJSON();
//     await item.destroy({ transaction: t });
//     await t.commit();

//     await logAction(req, {
//       entidad: "Agenda",
//       entidad_id: id,
//       accion: "delete_hard",
//       resultado: "success",
//       empresa_id: snap.empresa_id ?? null,
//       sucursal_id: snap.sucursal_id ?? null,
//       old_values: snap,
//       detalle: `Agenda #${id} eliminada definitivamente`,
//       critico: true,
//     });

//     return res.json({ mensaje: "Agenda eliminada definitivamente", id });
//   } catch (err) {
//     await t.rollback();
//     console.error("❌ eliminarAgendaHard:", err);

//     await logAction(req, {
//       entidad: "Agenda",
//       accion: "delete_hard",
//       resultado: "fail",
//       error_mensaje: err.message,
//       critico: true,
//     });

//     return res.status(400).json({ error: "No se pudo eliminar definitivamente" });
//   }
// };


//--------------------------------------------------------------------------------
import { Op } from "sequelize";
import { sequelize } from "../../config/database.js";
import Agenda from "../../models/agenda/registroAgendaModel.js";

/* =========================
   Helpers de fechas/recurrencia
   ========================= */
function toDateOnly(d) {
  const dt = new Date(d);
  const year = dt.getFullYear();
  const month = String(dt.getMonth() + 1).padStart(2, "0");
  const day = String(dt.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(dateStr, days) {
  const [y, m, d] = String(dateStr).split("-").map(Number);
  const base = new Date(y, m - 1, d);
  base.setDate(base.getDate() + Number(days || 0));
  return toDateOnly(base);
}

function addMonths(dateStr, months) {
  const [y, m, d] = String(dateStr).split("-").map(Number);
  const base = new Date(y, m - 1, d);
  base.setMonth(base.getMonth() + Number(months || 0));
  return toDateOnly(base);
}

function addYears(dateStr, years) {
  const [y, m, d] = String(dateStr).split("-").map(Number);
  const base = new Date(y, m - 1, d);
  base.setFullYear(base.getFullYear() + Number(years || 0));
  return toDateOnly(base);
}

function clampDay(year, monthIndex0, dia) {
  const lastDay = new Date(year, monthIndex0 + 1, 0).getDate();
  return Math.min(Math.max(Number(dia), 1), lastDay);
}

/**
 * Calcula la próxima fecha_vencimiento
 */
export function calcularProximoVencimiento({
  fecha,
  fecha_vencimiento,
  periodicidad = "unica",
  repetir_cada = 1,
  dia_vencimiento = null,
  repetir_hasta = null,
}) {
  if (fecha_vencimiento) return toDateOnly(fecha_vencimiento);

  const base = toDateOnly(fecha || new Date());
  let next = base;

  switch (periodicidad) {
    case "unica":
      next = base;
      break;
    case "diaria":
      next = addDays(base, repetir_cada);
      break;
    case "semanal":
      next = addDays(base, 7 * repetir_cada);
      break;
    case "mensual": {
      const b = new Date(base);
      const y = b.getFullYear();
      const m0 = b.getMonth();
      const targetM0 = m0 + Number(repetir_cada || 1);
      const d = (dia_vencimiento != null)
        ? clampDay(y, targetM0, dia_vencimiento)
        : b.getDate();
      next = toDateOnly(new Date(y, targetM0, d));
      break;
    }
    case "anual": {
      const b = new Date(base);
      const y = b.getFullYear();
      const m0 = b.getMonth();
      const d = (dia_vencimiento != null)
        ? clampDay(y + Number(repetir_cada || 1), m0, dia_vencimiento)
        : b.getDate();
      next = toDateOnly(new Date(y + Number(repetir_cada || 1), m0, d));
      break;
    }
    default:
      next = base;
  }

  if (repetir_hasta && next > toDateOnly(repetir_hasta)) return null;
  return next;
}

/* =========================
   Normalización del payload
   ========================= */
function normalizarPayload(body) {
  const out = { ...body };

  // Números
  if (out.costo != null) out.costo = Number(out.costo);
  if (out.repetir_cada != null) out.repetir_cada = Number(out.repetir_cada) || 1;
  if (out.dia_vencimiento != null) out.dia_vencimiento = Number(out.dia_vencimiento) || null;
  if (out.recordatorio_dias_antes != null) out.recordatorio_dias_antes = Number(out.recordatorio_dias_antes) || null;

  // Fechas (YYYY-MM-DD)
  if (out.fecha) out.fecha = toDateOnly(out.fecha);
  if (out.fecha_vencimiento) out.fecha_vencimiento = toDateOnly(out.fecha_vencimiento);
  if (out.repetir_hasta) out.repetir_hasta = toDateOnly(out.repetir_hasta);

  // Enums
  const IMPORT = ["baja", "media", "alta", "critica"];
  if (out.importancia && !IMPORT.includes(out.importancia)) out.importancia = "media";

  const EST = ["pendiente", "parcial", "realizado", "postergado"];
  if (out.realizado && !EST.includes(out.realizado)) out.realizado = "pendiente";

  const PER = ["unica", "diaria", "semanal", "mensual", "anual"];
  if (out.periodicidad && !PER.includes(out.periodicidad)) out.periodicidad = "unica";

  // Si no viene fecha_vencimiento, calcular
  if (!out.fecha_vencimiento) {
    out.fecha_vencimiento = calcularProximoVencimiento({
      fecha: out.fecha,
      fecha_vencimiento: out.fecha_vencimiento,
      periodicidad: out.periodicidad,
      repetir_cada: out.repetir_cada,
      dia_vencimiento: out.dia_vencimiento,
      repetir_hasta: out.repetir_hasta,
    });
  }

  return out;
}

/* =========================
   Controllers (mutaciones con hooks y ALS)
   ========================= */

// POST /agenda
export const crearAgenda = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const payload = normalizarPayload(req.body);
    if (!payload.titulo) throw new Error("titulo requerido");
    if (!payload.fecha) throw new Error("fecha requerida");

    const item = await Agenda.create(payload, { transaction: t });
    await t.commit();
    return res.status(201).json(item);
  } catch (err) {
    await t.rollback();
    console.error("❌ crearAgenda:", err);
    return res.status(400).json({ error: err.message || "No se pudo crear la agenda" });
  }
};

// GET /agenda
export const listarAgenda = async (req, res) => {
  try {
    const {
      empresa_id, sucursal_id, importancia, realizado, periodicidad,
      fecha_desde, fecha_hasta,
      fecha_campo, // "fecha" | "fecha_vencimiento"
      q, limit = 100, offset = 0,
      incluir_anulados, anulado,
    } = req.query;

    const where = {};

    // anulados
    if (typeof anulado !== "undefined") {
      where.anulado = String(anulado) === "true";
    } else if (!incluir_anulados || String(incluir_anulados) !== "true") {
      where.anulado = false;
    }

    if (empresa_id) where.empresa_id = Number(empresa_id);
    if (sucursal_id) where.sucursal_id = Number(sucursal_id);
    if (importancia) where.importancia = importancia;
    if (realizado) where.realizado = realizado;
    if (periodicidad) where.periodicidad = periodicidad;

    const campoFecha = (fecha_campo === "fecha") ? "fecha" : "fecha_vencimiento";
    if (fecha_desde || fecha_hasta) {
      where[campoFecha] = {};
      if (fecha_desde) where[campoFecha][Op.gte] = fecha_desde;
      if (fecha_hasta) where[campoFecha][Op.lte] = fecha_hasta;
    }

    if (q) {
      where[Op.or] = [
        { titulo: { [Op.iLike]: `%${q}%` } },
        { descripcion: { [Op.iLike]: `%${q}%` } },
        { observaciones: { [Op.iLike]: `%${q}%` } },
      ];
    }

    const rows = await Agenda.findAll({
      where,
      order: [[campoFecha, "ASC"], ["id", "ASC"]],
      limit: Number(limit),
      offset: Number(offset),
    });

    return res.json(rows);
  } catch (err) {
    console.error("❌ listarAgenda:", err);
    return res.status(400).json({ error: "No se pudo listar la agenda" });
  }
};

// GET /agenda/:id
export const obtenerAgenda = async (req, res) => {
  try {
    const id = Number(req.params.id || 0);
    const item = await Agenda.findByPk(id);
    if (!item) return res.status(404).json({ error: "Agenda no encontrada" });
    return res.json(item);
  } catch (err) {
    console.error("❌ obtenerAgenda:", err);
    return res.status(400).json({ error: "No se pudo obtener agenda" });
  }
};

// PUT /agenda/:id
export const actualizarAgenda = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const id = Number(req.params.id || 0);

    const item = await Agenda.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!item) {
      await t.rollback();
      return res.status(404).json({ error: "Agenda no encontrada" });
    }

    const payload = normalizarPayload(req.body);

    await item.update(payload, { transaction: t });
    await t.commit();
    return res.json(item);
  } catch (err) {
    await t.rollback();
    console.error("❌ actualizarAgenda:", err);
    return res.status(400).json({ error: err.message || "No se pudo actualizar agenda" });
  }
};

// PATCH /agenda/:id/estado
export const cambiarEstadoAgenda = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const id = Number(req.params.id || 0);
    const { realizado } = req.body || {};
    const EST = ["pendiente", "parcial", "realizado", "postergado"];
    if (!EST.includes(realizado)) throw new Error("Estado inválido");

    const item = await Agenda.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!item) {
      await t.rollback();
      return res.status(404).json({ error: "Agenda no encontrada" });
    }

    await item.update({ realizado }, { transaction: t });
    await t.commit();
    return res.json(item);
  } catch (err) {
    await t.rollback();
    console.error("❌ cambiarEstadoAgenda:", err);
    return res.status(400).json({ error: err.message || "No se pudo cambiar el estado" });
  }
};

// POST /agenda/:id/postergar
export const postergarAgenda = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const id = Number(req.params.id || 0);
    const { dias, a_proxima_ocurrencia } = req.body || {};

    const item = await Agenda.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!item) {
      await t.rollback();
      return res.status(404).json({ error: "Agenda no encontrada" });
    }

    let nuevaFechaVto = item.fecha_vencimiento || item.fecha;

    if (a_proxima_ocurrencia) {
      const next = calcularProximoVencimiento({
        fecha: item.fecha_vencimiento || item.fecha,
        periodicidad: item.periodicidad,
        repetir_cada: item.repetir_cada,
        dia_vencimiento: item.dia_vencimiento,
        repetir_hasta: item.repetir_hasta,
      });
      if (!next) throw new Error("No hay próxima ocurrencia (repetir_hasta alcanzado o configuración inválida)");
      nuevaFechaVto = next;
    } else {
      const nd = Number(dias || 0);
      if (!nd) throw new Error("Debes indicar 'dias' o 'a_proxima_ocurrencia'");
      nuevaFechaVto = addDays(nuevaFechaVto, nd);
    }

    await item.update(
      { fecha_vencimiento: nuevaFechaVto, realizado: "postergado" },
      { transaction: t }
    );

    await t.commit();
    return res.json(item);
  } catch (err) {
    await t.rollback();
    console.error("❌ postergarAgenda:", err);
    return res.status(400).json({ error: err.message || "No se pudo postergar" });
  }
};

// DELETE /agenda/:id  (soft delete → update anulado: true)
export const eliminarAgenda = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const id = Number(req.params.id || 0);
    const item = await Agenda.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!item) {
      await t.rollback();
      return res.status(404).json({ error: "Agenda no encontrada" });
    }

    await item.update({ anulado: true }, { transaction: t });

    await t.commit();
    return res.json({ mensaje: "Agenda anulada", id: item.id });
  } catch (err) {
    await t.rollback();
    console.error("❌ eliminarAgenda:", err);
    return res.status(400).json({ error: "No se pudo anular la agenda" });
  }
};

// DELETE /agenda/:id/hard  (eliminación definitiva)
export const eliminarAgendaHard = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const id = Number(req.params.id || 0);
    const item = await Agenda.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!item) {
      await t.rollback();
      return res.status(404).json({ error: "Agenda no encontrada" });
    }

    await item.destroy({ transaction: t });

    await t.commit();
    return res.json({ mensaje: "Agenda eliminada definitivamente", id });
  } catch (err) {
    await t.rollback();
    console.error("❌ eliminarAgendaHard:", err);
    return res.status(400).json({ error: "No se pudo eliminar definitivamente" });
  }
};

// GET /agenda/proximos?vencen_en_dias=7&empresa_id=..&sucursal_id=..
export const proximosVencimientos = async (req, res) => {
  try {
    const { vencen_en_dias = 7, empresa_id, sucursal_id } = req.query;
    const hoy = toDateOnly(new Date());
    const hasta = addDays(hoy, Number(vencen_en_dias));

    const where = {
      anulado: false,
      realizado: { [Op.in]: ["pendiente", "parcial", "postergado"] },
      fecha_vencimiento: { [Op.gte]: hoy, [Op.lte]: hasta },
    };
    if (empresa_id) where.empresa_id = Number(empresa_id);
    if (sucursal_id) where.sucursal_id = Number(sucursal_id);

    const rows = await Agenda.findAll({
      where,
      order: [["fecha_vencimiento", "ASC"], ["importancia", "DESC"], ["id", "ASC"]],
      limit: 200,
    });

    return res.json(rows);
  } catch (err) {
    console.error("❌ proximosVencimientos:", err);
    return res.status(400).json({ error: "No se pudo obtener próximos vencimientos" });
  }
};
