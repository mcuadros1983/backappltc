

// server/controllers/gmedia/registroHaciendaController.js
import { Op } from "sequelize";
import { sequelize } from "../../config/database.js";
import Hacienda from "../../models/gmedia/hacienda.js";
import RegistroHacienda from "../../models/gmedia/registrohacienda.js";
import ComprobanteEgreso from "../../models/iva/comprobanteegreso.js";

/* =======================
   Helpers
======================= */
const N = (v) => Number(v) || 0;

const calcularCamposItem = (it = {}) => {
  const pesoneto = N(it.pesoneto);
  const preciokgvivo = N(it.preciokgvivo);
  const importeneto = pesoneto * preciokgvivo;

  // mantener 'comsion'
  const costos =
    N(it.flete) +
    N(it.comsion) +
    N(it.viaticos) +
    N(it.imptoalcheque) +
    N(it.gastosfaena);

  const montototal = importeneto + costos;

  let rendimiento = null;
  if (it.kgsromaneo && pesoneto > 0) {
    rendimiento = (N(it.kgsromaneo) / pesoneto) * 100;
  }

  return {
    ...it,
    importeneto: Number(importeneto.toFixed(2)),
    montototal: Number(montototal.toFixed(2)),
    rendimiento: rendimiento !== null ? Number(rendimiento.toFixed(2)) : null,
  };
};

/** Recalcula monto y anulado del header (Hacienda).
 *  - monto = SUM(montototal) de ítems NO anulados
 *  - anulado = true si no queda ningún ítem activo
 */
const recalcHeader = async (hacienda_id, t) => {
  const [{ total }] =
    (await RegistroHacienda.findAll({
      attributes: [[sequelize.fn("SUM", sequelize.col("montototal")), "total"]],
      where: { hacienda_id, anulado: false },
      raw: true,
      transaction: t,
    })) || [{ total: 0 }];

  const activos = await RegistroHacienda.count({
    where: { hacienda_id, anulado: false },
    transaction: t,
  });

  await Hacienda.update(
    {
      monto: Number(total || 0).toFixed(2),
      anulado: activos === 0,
    },
    { where: { id: hacienda_id }, transaction: t }
  );
};

/* =======================
   Controllers
======================= */

// Crea un ÍTEM (debe venir hacienda_id)
export const crearRegistroHacienda = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const data = req.body || {};
    const hacienda_id = Number(data.hacienda_id) || null;
    if (!hacienda_id) throw new Error("hacienda_id requerido");

    // normalizar + calcular campos derivados
    const it0 = calcularCamposItem(data);

    const num = (v, d = 2) => {
      const n = Number(v);
      return Number.isFinite(n) ? Number(n.toFixed(d)) : 0;
    };

    it0.pesoneto = num(it0.pesoneto);
    it0.preciokgvivo = num(it0.preciokgvivo);
    it0.importeneto = num(it0.importeneto);
    it0.flete = num(it0.flete);
    it0.comsion = num(it0.comsion);
    it0.viaticos = num(it0.viaticos);
    it0.imptoalcheque = num(it0.imptoalcheque);
    it0.gastosfaena = num(it0.gastosfaena);
    it0.montototal = num(it0.montototal);
    it0.kgsromaneo = num(it0.kgsromaneo);
    it0.rendimiento = it0.rendimiento != null ? num(it0.rendimiento) : null;

    // preciokgcarne auto si no viene o no es válido
    const kgRom = Number(it0.kgsromaneo) || 0;
    if (it0.preciokgcarne == null || !Number.isFinite(Number(it0.preciokgcarne))) {
      it0.preciokgcarne = kgRom > 0 ? num(Number(it0.montototal || 0) / kgRom) : 0;
    } else {
      it0.preciokgcarne = num(it0.preciokgcarne);
    }

    it0.hacienda_id = hacienda_id;
    it0.anulado = false;

    const row = await RegistroHacienda.create(it0, { transaction: t });

    // recalc header
    await recalcHeader(hacienda_id, t);

    await t.commit();
    return res.status(201).json(row);
  } catch (err) {
    await t.rollback();
    console.error("❌ crearRegistroHacienda:", err);
    return res.status(400).json({ error: err.message || "No se pudo crear el ítem" });
  }
};

// Lista ÍTEMS con filtros y paginación + include de Hacienda (para comprobar comprobante_id)
export const listarRegistroHacienda = async (req, res) => {
  try {
    const {
      fecha_desde,
      fecha_hasta,
      proveedor_id,
      frigorifico_id,
      empresa_id,
      includeAnulados = "0",
      limit = 100,
      offset = 0,
    } = req.query;

    const where = {};
    if (includeAnulados !== "1") where.anulado = false;
    if (fecha_desde || fecha_hasta) {
      where.fecha = {};
      if (fecha_desde) where.fecha[Op.gte] = fecha_desde;
      if (fecha_hasta) where.fecha[Op.lte] = fecha_hasta;
    }
    if (proveedor_id) where.proveedor_id = Number(proveedor_id);
    if (frigorifico_id) where.frigorifico_id = Number(frigorifico_id);
    if (empresa_id) where.empresa_id = Number(empresa_id);

    // const rows = await RegistroHacienda.findAll({
    //   where,
    //   order: [["fecha", "ASC"], ["id", "ASC"]],
    //   limit: Number(limit),
    //   offset: Number(offset),
    //   include: [
    //     {
    //       model: Hacienda,
    //       attributes: ["id", "comprobante_id"],
    //       required: false, // no filtra, solo adjunta si existe
    //     },
    //   ],
    // });


    // return res.json(rows);

    const rows = await RegistroHacienda.findAll({
      where,
      order: [["fecha", "ASC"], ["id", "ASC"]],
      limit: Number(limit),
      offset: Number(offset),
      include: [
        {
          model: Hacienda,
          as: "hacienda",                  // 👈 alias del belongsTo
          attributes: ["id", "comprobante_id"],
          required: false,
        },
      ],
    });
    return res.json(rows);
  } catch (err) {
    console.error("❌ listarRegistroHacienda:", err);
    return res.status(400).json({ error: "No se pudo listar registros" });
  }
};

// Trae un ítem por id (incluye Hacienda)
export const obtenerRegistroHaciendaPorId = async (req, res) => {
  try {
    const { id } = req.params;
    // const row = await RegistroHacienda.findByPk(id, {
    //   include: [{ model: Hacienda, attributes: ["id", "comprobante_id"], required: false }],
    // });
    const row = await RegistroHacienda.findByPk(id, {
      include: [
        {
          model: Hacienda,
          as: "hacienda",                  // 👈 alias del belongsTo
          attributes: ["id", "comprobante_id"],
          required: false,
        },
      ],
    });
    if (!row) return res.status(404).json({ error: "Registro no encontrado" });
    return res.json(row);
  } catch (err) {
    console.error("❌ obtenerRegistroHaciendaPorId:", err);
    return res.status(400).json({ error: "No se pudo obtener el registro" });
  }
};

// Actualiza un ítem y recalcula header
export const actualizarRegistroHacienda = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const data = req.body || {};

    const row = await RegistroHacienda.findByPk(id, { transaction: t });
    if (!row) throw new Error("Registro no encontrado");

    const oldHaciendaId = row.hacienda_id;

    const merged = calcularCamposItem({ ...row.toJSON(), ...data });

    const num = (v, d = 2) => {
      const n = Number(v);
      return Number.isFinite(n) ? Number(n.toFixed(d)) : 0;
    };

    merged.pesoneto = num(merged.pesoneto);
    merged.preciokgvivo = num(merged.preciokgvivo);
    merged.importeneto = num(merged.importeneto);
    merged.flete = num(merged.flete);
    merged.comsion = num(merged.comsion);
    merged.viaticos = num(merged.viaticos);
    merged.imptoalcheque = num(merged.imptoalcheque);
    merged.gastosfaena = num(merged.gastosfaena);
    merged.montototal = num(merged.montototal);
    merged.kgsromaneo = num(merged.kgsromaneo);
    merged.rendimiento = merged.rendimiento != null ? num(merged.rendimiento) : null;

    const kgRom = Number(merged.kgsromaneo) || 0;
    if (merged.preciokgcarne == null || !Number.isFinite(Number(merged.preciokgcarne))) {
      merged.preciokgcarne = kgRom > 0 ? num(Number(merged.montototal || 0) / kgRom) : 0;
    } else {
      merged.preciokgcarne = num(merged.preciokgcarne);
    }

    const newHaciendaId = data.hacienda_id != null ? Number(data.hacienda_id) : oldHaciendaId;

    await row.update(
      { ...merged, hacienda_id: newHaciendaId },
      { transaction: t }
    );

    await recalcHeader(newHaciendaId, t);
    if (newHaciendaId !== oldHaciendaId) {
      await recalcHeader(oldHaciendaId, t);
    }

    await t.commit();
    return res.json(row);
  } catch (err) {
    await t.rollback();
    console.error("❌ actualizarRegistroHacienda:", err);
    return res.status(400).json({ error: err.message || "No se pudo actualizar el registro" });
  }
};

// Anula (soft delete) un ítem + recalcula header
export const anularRegistroHacienda = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;

    const row = await RegistroHacienda.findByPk(id, { transaction: t });
    if (!row) return res.status(404).json({ error: "Registro no encontrado" });

    if (row.anulado) {
      await t.commit();
      return res.json({ ok: true, mensaje: "Ya estaba anulado" });
    }

    await row.update({ anulado: true }, { transaction: t });
    await recalcHeader(row.hacienda_id, t);

    await t.commit();
    return res.json({ ok: true, mensaje: "Registro anulado" });
  } catch (err) {
    await t.rollback();
    console.error("❌ anularRegistroHacienda:", err);
    return res.status(400).json({ error: "No se pudo anular el registro" });
  }
};

// Restaura un ítem anulado + recalcula header
export const restaurarRegistroHacienda = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;

    const row = await RegistroHacienda.findByPk(id, { transaction: t });
    if (!row) return res.status(404).json({ error: "Registro no encontrado" });

    if (!row.anulado) {
      await t.commit();
      return res.json({ ok: true, mensaje: "Ya estaba activo" });
    }

    await row.update({ anulado: false }, { transaction: t });
    await recalcHeader(row.hacienda_id, t);

    await t.commit();
    return res.json({ ok: true, mensaje: "Registro restaurado" });
  } catch (err) {
    await t.rollback();
    console.error("❌ restaurarRegistroHacienda:", err);
    return res.status(400).json({ error: "No se pudo restaurar el registro" });
  }
};

// export const eliminarRegistroHacienda = async (req, res) => {
//   const t = await sequelize.transaction();
//   try {
//     const id = Number(req.params.id || 0);
//     if (!id) throw new Error("ID inválido");

//     const reg = await RegistroHacienda.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE });
//     if (!reg) {
//       await t.rollback();
//       return res.status(404).json({ error: "Registro de Hacienda no encontrado" });
//     }

//     const hac = await Hacienda.findByPk(reg.hacienda_id, { transaction: t, lock: t.LOCK.UPDATE });
//     if (!hac) {
//       // Caso raro: no hay header -> sólo borramos el item
//       await RegistroHacienda.destroy({ where: { id }, transaction: t });
//       await t.commit();
//       return res.status(200).json({ mensaje: "Registro de Hacienda eliminado (sin header)" });
//     }

//     const round2 = (n) => Number((Number(n || 0)).toFixed(2));
//     const regMonto = round2(reg.montototal);

//     // 1) Borrar el registro (HARD DELETE)
//     await RegistroHacienda.destroy({ where: { id }, transaction: t });

//     // 2) ¿Quedan ítems?
//     const restantes = await RegistroHacienda.count({
//       where: { hacienda_id: hac.id },
//       transaction: t,
//     });

//     let acciones = { registro_eliminado: id, hacienda_id: hac.id, hacienda_eliminada: false, desvinculo_comprobante_id: null };

//     if (restantes === 0) {
//       // No quedan ítems → si Hacienda estaba vinculada, desvincular el comprobante y eliminar Hacienda
//       if (hac.comprobante_id) {
//         const comp = await ComprobanteEgreso.findByPk(hac.comprobante_id, { transaction: t, lock: t.LOCK.UPDATE });
//         if (comp) {
//           await comp.update({ hacienda_id: null }, { transaction: t });
//           acciones.desvinculo_comprobante_id = comp.id;
//         }
//       }
//       await Hacienda.destroy({ where: { id: hac.id }, transaction: t });
//       acciones.hacienda_eliminada = true;

//       await t.commit();
//       return res.status(200).json({
//         mensaje: "Registro de Hacienda eliminado. No quedaban ítems: Hacienda eliminada y comprobante (si existía) desvinculado.",
//         ...acciones,
//       });
//     }

//     // 3) Aún quedan ítems → actualizar monto del header restando el del registro eliminado
//     const nuevoMonto = Math.max(0, round2(Number(hac.monto || 0) - regMonto));

//     // Por seguridad: si quedó ~0, también eliminar Hacienda (y desvincular comp si corresponde)
//     if (nuevoMonto <= 0.009) {
//       if (hac.comprobante_id) {
//         const comp = await ComprobanteEgreso.findByPk(hac.comprobante_id, { transaction: t, lock: t.LOCK.UPDATE });
//         if (comp) {
//           await comp.update({ hacienda_id: null }, { transaction: t });
//           acciones.desvinculo_comprobante_id = comp.id;
//         }
//       }
//       await Hacienda.destroy({ where: { id: hac.id }, transaction: t });
//       acciones.hacienda_eliminada = true;

//       await t.commit();
//       return res.status(200).json({
//         mensaje: "Registro de Hacienda eliminado. Monto del header quedó en 0: Hacienda eliminada y comprobante (si existía) desvinculado.",
//         ...acciones,
//       });
//     }

//     // 4) Actualizar monto del header y conservar Hacienda
//     await hac.update({ monto: nuevoMonto }, { transaction: t });

//     await t.commit();
//     return res.status(200).json({
//       mensaje: "Registro de Hacienda eliminado. Monto de Hacienda actualizado.",
//       ...acciones,
//       nuevo_monto_hacienda: nuevoMonto,
//       items_restantes: restantes,
//     });
//   } catch (error) {
//     await t.rollback();
//     console.error("❌ eliminarRegistroHacienda:", error);
//     return res.status(500).json({ error: error.message || "Error al eliminar el registro de Hacienda" });
//   }
// };

export const eliminarRegistroHacienda = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const id = Number(req.params.id || 0);
    if (!id) throw new Error("ID inválido");

    const reg = await RegistroHacienda.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!reg) {
      await t.rollback();
      return res.status(404).json({ error: "Registro de Hacienda no encontrado" });
    }

    const hac = await Hacienda.findByPk(reg.hacienda_id, { transaction: t, lock: t.LOCK.UPDATE });
    // Si por algún motivo no hay header, solo borramos el registro
    if (!hac) {
      await RegistroHacienda.destroy({ where: { id }, transaction: t });
      await t.commit();
      return res.status(200).json({ mensaje: "Registro de Hacienda eliminado (sin header)" });
    }

    // 1) Borrar el registro (HARD DELETE)
    await RegistroHacienda.destroy({ where: { id }, transaction: t });

    // 2) Recalcular agregados de los ítems restantes
    const [restantes, sumMontototalRaw] = await Promise.all([
      RegistroHacienda.count({ where: { hacienda_id: hac.id }, transaction: t }),
      RegistroHacienda.sum("montototal", { where: { hacienda_id: hac.id }, transaction: t }),
    ]);

    const round2 = (n) => Number((Number(n || 0)).toFixed(2));
    const sumMontototal = round2(sumMontototalRaw || 0);

    // 3) Si no quedan ítems o el total quedó ≈ 0, eliminar header y desvincular comprobante si corresponde
    if (restantes === 0 || sumMontototal <= 0.009) {
      if (hac.comprobante_id) {
        const comp = await ComprobanteEgreso.findByPk(hac.comprobante_id, { transaction: t, lock: t.LOCK.UPDATE });
        if (comp && Number(comp.hacienda_id) === hac.id) {
          await comp.update({ hacienda_id: null }, { transaction: t });
        }
      }
      await Hacienda.destroy({ where: { id: hac.id }, transaction: t });

      await t.commit();
      return res.status(200).json({
        mensaje: "Registro eliminado. No quedaban ítems (o total ≈ 0): Hacienda eliminada y comprobante (si existía) desvinculado.",
        registro_eliminado: id,
        hacienda_eliminada: hac.id,
        nuevo_monto_hacienda: 0,
        items_restantes: 0,
      });
    }

    // 4) Si quedan ítems, actualizar monto del header = SUM(montototal)
    await hac.update({ monto: sumMontototal }, { transaction: t });

    await t.commit();
    return res.status(200).json({
      mensaje: "Registro eliminado. Monto de Hacienda recalculado.",
      registro_eliminado: id,
      hacienda_id: hac.id,
      nuevo_monto_hacienda: sumMontototal,
      items_restantes: restantes,
    });
  } catch (error) {
    await t.rollback();
    console.error("❌ eliminarRegistroHacienda:", error);
    return res.status(500).json({ error: error.message || "Error al eliminar el registro de Hacienda" });
  }
};
