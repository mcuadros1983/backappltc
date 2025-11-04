import { Op } from "sequelize";
import { sequelize } from "../../config/database.js";
import RetiroTesoreria from "../../models/tesoreria/retirotesoreria.js";
import MovimientoCajaTesoreria from "../../models/tesoreria/movimientocajatesoreria.js";
import Retiro from "../../models/caja/retiroModel.js";
import Sucursal from "../../models/gmedias/sucursalModel.js"

// ---------- helper ----------
async function recalcMovimientoFromRetiros(movimientoId, t) {
  const mov = await MovimientoCajaTesoreria.findByPk(movimientoId, { transaction: t, lock: t?.LOCK?.UPDATE });
  if (!mov) throw new Error("Movimiento de caja no encontrado");

  const sobres = await RetiroTesoreria.findAll({ where: { movimiento_id: movimientoId }, transaction: t });
  const total = sobres.reduce((a, r) => a + Number(r.importe || 0), 0);

  if (total > 0) {
    await mov.update({ monto: total, anulado: false }, { transaction: t });
  } else {
    await mov.update({
      monto: 0,
      anulado: true,
      observaciones: sequelize.literal(
        `COALESCE(observaciones,'') || ' | Movimiento anulado por eliminación de sobres (' || CURRENT_DATE || ')'`
      ),
    }, { transaction: t });

    // Si preferís borrar físicamente cuando queda en 0:
    // await mov.destroy({ transaction: t });
  }
  return { movimiento: mov, total, cantidadSobres: sobres.length };
}

// ---------- CREA movimiento ingreso + N retiros (sobres) ----------
// ---------- CREA movimiento ingreso + N retiros (sobres) ----------
export const registrarRetirosSucursalIngreso = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const {
      caja_id, sucursal_id, fecha,
      formacobro_id,
      categoriaingreso_id = null,
      descripcion = null,
      observaciones = null,
      idempotencyKey = null,
      retiros = [],
    } = req.body || {};

    if (!caja_id) throw new Error("caja_id requerido");
    if (!sucursal_id) throw new Error("sucursal_id requerido");
    if (!fecha) throw new Error("fecha requerida");
    if (!formacobro_id) throw new Error("formacobro_id requerido");
    if (!Array.isArray(retiros) || retiros.length === 0) throw new Error("Debe enviar al menos un sobre");

    // 👇 Buscar nombre de la sucursal
    const sucursal = await Sucursal.findByPk(sucursal_id, {
      attributes: ["id", "nombre", "codigo"],
      transaction: t,
    });
    if (!sucursal) throw new Error("Sucursal no encontrada");

    // ¿ya existe un movimiento de ingreso para ese día y sucursal?
    let movimiento = await MovimientoCajaTesoreria.findOne({
      where: {
        tipo: "ingreso",
        fecha,
        caja_id,
        referencia_tipo: "RetiroSucursal",
        referencia_id: sucursal_id,
      },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!movimiento) {
      movimiento = await MovimientoCajaTesoreria.create({
        tipo: "ingreso",
        descripcion: descripcion || `Retiros sucursal ${sucursal.nombre} (${fecha})`, // 👈 usar nombre
        monto: 0,
        fecha,
        caja_id,
        formapago_id: formacobro_id,
        referencia_id: sucursal_id,
        referencia_tipo: "RetiroSucursal",
        observaciones: observaciones || null,
        anulado: false,
        ordenpago_id: null,
        categoriaegreso_id: null,
        categoriaingreso_id: categoriaingreso_id || null,
        imputacioncontable_id: null,
        idempotency_key: idempotencyKey || null,
        proyecto_id: null,
      }, { transaction: t });
    } else {
      if (movimiento.anulado) {
        await movimiento.update({ anulado: false }, { transaction: t });
      }
      if (categoriaingreso_id && !movimiento.categoriaingreso_id) {
        await movimiento.update({ categoriaingreso_id }, { transaction: t });
      }
    }

    // crear sobres
    const rows = [];
    for (const r of retiros) {
      const importe = Number(r?.importe || 0);
      if (!(importe > 0)) throw new Error("Importe de sobre inválido");
      const f = r?.fecha || fecha;

      const row = await RetiroTesoreria.create({
        fecha: f,
        importe,
        sucursal_id,
        caja_id,
        movimiento_id: movimiento.id,
        retiroSucursalId: r?.retiroSucursalId ?? null,
      }, { transaction: t });
      rows.push(row);
    }

    const { total } = await recalcMovimientoFromRetiros(movimiento.id, t);

    await t.commit();
    return res.status(201).json({
      ok: true,
      movimiento_id: movimiento.id,
      total,
      creados: rows.length,
      movimiento,
    });
  } catch (err) {
    await t.rollback();
    console.error("registrarRetirosSucursalIngreso:", err);
    return res.status(400).json({ error: err.message || "No se pudo registrar los retiros" });
  }
};


// ---------- LISTAR / CRUD simple de sobres ----------
export const listarRetiros = async (req, res) => {
  try {
    const {
      fecha,            // <- NUEVO (filtro exacto)
      fecha_desde,
      fecha_hasta,
      sucursal_id,      // <- NUEVO
      caja_id,          // <- NUEVO (para encontrar por movimiento.caja_id)
      movimiento_id,
    } = req.query || {};

    const where = {};
    if (movimiento_id) where.movimiento_id = Number(movimiento_id);
    if (sucursal_id) where.sucursal_id = Number(sucursal_id);
    if (fecha) where.fecha = fecha; // filtro exacto

    if (!fecha && (fecha_desde || fecha_hasta)) {
      where.fecha = {};
      if (fecha_desde) where.fecha[Op.gte] = fecha_desde;
      if (fecha_hasta) where.fecha[Op.lte] = fecha_hasta;
    }

    // Si viene caja_id, filtramos por los retiros cuyo movimiento pertenezca a esa caja
    let lista = await RetiroTesoreria.findAll({ where, order: [["fecha", "ASC"], ["id", "ASC"]] });

    if (caja_id) {
      const movIds = [...new Set(lista.map(r => r.movimiento_id))];
      if (movIds.length) {
        const movs = await MovimientoCajaTesoreria.findAll({
          where: { id: { [Op.in]: movIds }, caja_id: Number(caja_id) },
          attributes: ["id"],
        });
        const validIds = new Set(movs.map(m => m.id));
        lista = lista.filter(r => validIds.has(r.movimiento_id));
      } else {
        lista = [];
      }
    }

    return res.json(lista);
  } catch (err) {
    console.error("listarRetiros:", err);
    return res.status(400).json({ error: err.message || "No se pudo listar retiros" });
  }
};

export const obtenerRetiroTesoreriaPorId = async (req, res) => {
  try {
    const row = await RetiroTesoreria.findByPk(req.params.id);
    console.log("buscando1")
    if (!row) return res.status(404).json({ error: "Retiro no encontrado" });
    return res.json(row);
  } catch (err) {
    return res.status(500).json({ error: "Error al obtener el retiro" });
  }
};

export const actualizarRetiroTesoreria = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const id = req.params.id;
    console.log("bucando2", req.body)
    const row = await RetiroTesoreria.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE });

    if (!row) {
      await t.rollback();
      return res.status(404).json({ error: "Retiro no encontrado" });
    }

    // por simplicidad NO permitimos cambiar sucursal_id ni movimiento_id desde aquí
    const { importe, fecha, retiroSucursalId } = req.body || {};
    const updates = {};
    if (importe !== undefined) {
      const n = Number(importe);
      if (!(n > 0)) throw new Error("Importe inválido");
      updates.importe = n;
    }
    if (fecha) updates.fecha = fecha;
    if (retiroSucursalId !== undefined) updates.retiroSucursalId = retiroSucursalId;

    await row.update(updates, { transaction: t });

    // recalcular movimiento
    const { total, movimiento } = await recalcMovimientoFromRetiros(row.movimiento_id, t);

    await t.commit();
    return res.json({ ok: true, retiro: row, movimiento, total });
  } catch (err) {
    await t.rollback();
    console.error("actualizarRetiroTesoreria:", err);
    return res.status(400).json({ error: err.message || "No se pudo actualizar el retiro" });
  }
};

export const eliminarRetiroTesoreria = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const id = req.params.id;
    console.log("bucando3")
    const row = await RetiroTesoreria.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!row) {
      await t.rollback();
      return res.status(404).json({ error: "Retiro no encontrado" });
    }
    const movId = row.movimiento_id;
    await row.destroy({ transaction: t });

    const { total, movimiento } = await recalcMovimientoFromRetiros(movId, t);

    await t.commit();
    return res.json({ ok: true, eliminado: id, movimiento, total });
  } catch (err) {
    await t.rollback();
    console.error("eliminarRetiroTesoreria:", err);
    return res.status(400).json({ error: err.message || "No se pudo eliminar el retiro" });
  }
};

export const actualizarRetirosPorMovimiento = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const movimiento_id = Number(req.params.movimientoId || req.params.id);
    const { retiros = [], fecha, descripcion, observaciones, categoriaingreso_id } = req.body || {};

    const mov = await MovimientoCajaTesoreria.findByPk(movimiento_id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!mov) {
      await t.rollback();
      return res.status(404).json({ error: "Movimiento no encontrado" });
    }
    if (String(mov.tipo) !== "ingreso" || mov.referencia_tipo !== "RetiroSucursal") {
      await t.rollback();
      return res.status(400).json({ error: "El movimiento no corresponde a Retiros de Sucursal" });
    }

    const existentes = await RetiroTesoreria.findAll({ where: { movimiento_id }, transaction: t, lock: t.LOCK.UPDATE });
    const byId = new Map(existentes.map(r => [r.id, r]));

    // IDs que vienen del cliente
    const incomingWithId = new Set(retiros.filter(r => r.id).map(r => Number(r.id)));

    // 1) BORRAR los que no vengan
    for (const r of existentes) {
      if (!incomingWithId.has(r.id)) {
        await r.destroy({ transaction: t });
      }
    }

    // 2) CREAR / ACTUALIZAR
    for (const r of retiros) {
      const n = Number(r.importe || 0);
      if (!(n > 0)) continue;

      if (r.id && byId.get(Number(r.id))) {
        // update
        await byId.get(Number(r.id)).update({ importe: n }, { transaction: t });
      } else {
        // create (usar sucursal_id del primer retiro existente o inferirla de descripción si la guardaste)
        // si guardaste sucursal_id en cada retiro, no hay problema:
        const sucursal_id = existentes[0]?.sucursal_id ?? null;
        await RetiroTesoreria.create(
          {
            fecha: fecha || mov.fecha,
            importe: n,
            sucursal_id,
            caja_id: mov.caja_id,
            movimiento_id,
            retiroSucursalId: r.retiroSucursalId ?? null,
          },
          { transaction: t }
        );
      }
    }

    // 3) Recalcular total y actualizar movimiento
    const nuevos = await RetiroTesoreria.findAll({ where: { movimiento_id }, transaction: t });
    const total = nuevos.reduce((a, r) => a + Number(r.importe || 0), 0);

    if (total <= 0) {
      // eliminar todo si no hay sobres
      await RetiroTesoreria.destroy({ where: { movimiento_id }, transaction: t });
      await mov.destroy({ transaction: t });
      await t.commit();
      return res.json({ ok: true, eliminadoMovimiento: true });
    }

    await mov.update(
      {
        monto: total,
        ...(fecha ? { fecha } : {}),
        ...(descripcion !== undefined ? { descripcion } : {}),
        ...(observaciones !== undefined ? { observaciones } : {}),
        ...(categoriaingreso_id !== undefined ? { categoriaingreso_id } : {}),
      },
      { transaction: t }
    );

    await t.commit();
    return res.json({ ok: true, movimiento: mov, total, retiros: nuevos });
  } catch (err) {
    await t.rollback();
    console.error("actualizarRetirosPorMovimiento:", err);
    return res.status(400).json({ error: err.message || "No se pudo actualizar los retiros" });
  }
};

export const eliminarTodosPorMovimiento = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const movimiento_id = Number(req.params.movimientoId || req.params.id);
    const mov = await MovimientoCajaTesoreria.findByPk(movimiento_id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!mov) {
      await t.rollback();
      return res.status(404).json({ error: "Movimiento no encontrado" });
    }

    await RetiroTesoreria.destroy({ where: { movimiento_id }, transaction: t });

    // Eliminar movimiento (o set anulado=true si querés conservar el rastro)
    await mov.destroy({ transaction: t });

    await t.commit();
    return res.json({ ok: true });
  } catch (err) {
    await t.rollback();
    console.error("eliminarTodosPorMovimiento:", err);
    return res.status(400).json({ error: err.message || "No se pudo eliminar" });
  }
};

export const listarRetirosInformados = async (req, res) => {
  try {
    const { sucursal_id, fecha } = req.query;
    const where = {};
    if (sucursal_id) where.sucursal_id = sucursal_id;
    if (fecha) where.fecha = fecha;

    const lista = await Retiro.findAll({ where, order: [["id", "ASC"]] });
    return res.json(lista);
  } catch (err) {
    console.error("listarRetirosInformados:", err);
    return res.status(500).json({ error: "Error al obtener retiros informados" });
  }
};

export const getRecepcionPorFecha = async (req, res) => {
  try {
    const { fecha_recepcion, sucursal_id } = req.query;

    if (!fecha_recepcion) {
      return res.status(400).json({ error: "Debe indicar fecha_recepcion" });
    }

    const where = { fecha_recepcion };
    if (sucursal_id) {
      where.sucursal_id = sucursal_id;
    }

    // Traemos los retiros recibidos en esa fecha
    const rows = await RetiroTesoreria.findAll({
      where,
      include: [
        {
          model: Sucursal,
          as: "sucursal", // 👈 alias según tu asociación
          attributes: ["id", "nombre", "codigo"],
        },
      ],
      raw: true,
      nest: true,
    });

    // Agrupar en memoria por sucursal y fecha origen
    const resumenMap = {};
    let totalGeneral = 0;

    for (const r of rows) {
      const sucId = r.sucursal_id;
      const sucNombre =
        r.sucursal?.nombre || r.sucursal?.descripcion || r.sucursal?.alias || `Sucursal #${sucId}`;
      const fechaOrigen = r.fecha;

      if (!resumenMap[sucId]) {
        resumenMap[sucId] = {
          sucursal_id: sucId,
          sucursal: sucNombre,
          totales: {}, // fecha_origen -> monto
          total_sucursal: 0,
        };
      }

      resumenMap[sucId].totales[fechaOrigen] =
        (resumenMap[sucId].totales[fechaOrigen] || 0) + Number(r.importe || 0);
      resumenMap[sucId].total_sucursal += Number(r.importe || 0);
      totalGeneral += Number(r.importe || 0);
    }

    // Formatear salida
    const resumen = Object.values(resumenMap).map((s) => ({
      sucursal_id: s.sucursal_id,
      sucursal: s.sucursal,
      totales: Object.entries(s.totales).map(([fecha_origen, total]) => ({
        fecha_origen,
        total,
      })),
      total_sucursal: s.total_sucursal,
    }));

    return res.json({
      fecha_recepcion,
      resumen,
      total_general: totalGeneral,
    });
  } catch (err) {
    console.error("getRecepcionPorFecha:", err);
    return res.status(500).json({ error: "No se pudo obtener la recepción" });
  }
};
