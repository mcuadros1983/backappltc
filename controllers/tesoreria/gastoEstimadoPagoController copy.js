import { Op } from "sequelize";
import GastoEstimadoPago from "../../models/tesoreria/gastoestimadopago.js";
import GastoEstimadoInstancia from "../../models/tesoreria/gastoestimadoinstancia.js";
import GastoEstimado from "../../models/tesoreria/gastoestimado.js";


async function recomputar(instanciaId) {
  const inst = await GastoEstimadoInstancia.findByPk(instanciaId);
  if (!inst) return null;

  const pagos = await GastoEstimadoPago.findAll({ where: { gastoestimado_instancia_id: instanciaId } });
  const total = pagos.reduce((a, p) => a + Number(p.monto_aplicado || 0), 0);

  inst.monto_pagado = total;

  const base = Number((inst.monto_real ?? inst.monto_estimado) ?? 0);
  let estado = "pendiente";
  if (total > 0 && total < base) estado = "parcial";
  if (total >= base && base > 0) estado = "pagado";

  const hoy = new Date().toISOString().slice(0, 10);
  if (estado !== "pagado" && inst.fecha_vencimiento < hoy) {
    estado = "vencido";
  }
  inst.estado = estado;

  await inst.save();
  return { instancia: inst, totalAplicado: total };
}

export async function listarPagos(req, res) {
  try {
    const { id } = req.params; // instancia_id
    const rows = await GastoEstimadoPago.findAll({
      where: { gastoestimado_instancia_id: id },
      order: [["fecha_aplicacion", "ASC"], ["id", "ASC"]],
    });
    res.json(rows);
  } catch (e) {
    console.error("listarPagos", e);
    res.status(500).json({ error: "Error listando pagos aplicados" });
  }
}

// ==== Helpers para rollover mensual ====
function daysInMonth(year, month /* 1..12 */) {
  return new Date(year, month, 0).getDate();
}
function clampDay(day, year, month) {
  const mdays = daysInMonth(year, month);
  if (!day) return mdays; // si no hay default, uso fin de mes
  return Math.max(1, Math.min(day, mdays));
}
function parsePeriodo(p /* 'YYYY-MM' */) {
  const [y, m] = String(p).split("-").map(n => parseInt(n, 10));
  return { y, m };
}
function nextPeriodoStr(p /* 'YYYY-MM' */) {
  const { y, m } = parsePeriodo(p);
  let ny = y, nm = m + 1;
  if (nm > 12) { nm = 1; ny = y + 1; }
  const mm = String(nm).padStart(2, "0");
  return `${ny}-${mm}`;
}

/**
 * Crea (si aplica) la instancia del mes siguiente cuando:
 *  - la instancia actual quedó 'pagado'
 *  - la plantilla está ACTIVA y es 'mensual'
 *  - no se pidió cancelar_renovacion
 *
 * El monto estimado del próximo mes toma:
 *  - totalAplicado (si se pasó)  Ó
 *  - monto_real de la instancia actual  Ó
 *  - monto_estimado de la instancia actual
 */
async function ensureNextMonthlyInstance(instancia, { totalAplicado } = {}) {
  try {
    // buscamos la plantilla para validar periodicidad/activo y defaults
    const plant = await GastoEstimado.findByPk(instancia.gastoestimado_id);
    if (!plant) return { created: false };
    if (plant.activo === false) return { created: false };
    if (plant.periodicidad !== "mensual") return { created: false };

    const nextPeriodo = nextPeriodoStr(instancia.periodo);
    const { y, m } = parsePeriodo(nextPeriodo);

    // fecha de vencimiento del mes siguiente con día clamp
    const dia = clampDay(plant.dia_vencimiento_default || 0, y, m);
    const fecha_vencimiento = new Date(y, m - 1, dia).toISOString().slice(0, 10);

    const montoBase =
      totalAplicado != null
        ? Number(totalAplicado || 0)
        : Number(instancia.monto_real ?? instancia.monto_estimado ?? 0);

    const [next, created] = await GastoEstimadoInstancia.findOrCreate({
      where: { gastoestimado_id: plant.id, periodo: nextPeriodo },
      defaults: {
        gastoestimado_id: plant.id,
        empresa_id: plant.empresa_id,
        proveedor_id: plant.proveedor_id,
        categoriaegreso_id: plant.categoriaegreso_id,
        sucursal_id: plant.sucursal_id,
        tipocomprobante_id: plant.tipocomprobante_id ?? null,
        formapago_id: plant.formapago_id ?? null,

        descripcion: plant.descripcion,
        periodo: nextPeriodo,
        fecha_vencimiento,
        monto_estimado: montoBase,
        monto_real: null,
        monto_pagado: 0,
        estado: "pendiente",
        created_from: "rollover",
        observaciones: plant.observaciones || null,
      },
    });

    return { created, next };
  } catch (e) {
    // si falla, no detenemos el flujo del pago; solo log
    console.error("ensureNextMonthlyInstance error:", e);
    return { created: false };
  }
}

//
export async function aplicarPago(req, res) { 
  try {
    const { id } = req.params; // instancia_id
    const {
      referencia_tipo,
      referencia_id,
      formapago_id,
      fecha_aplicacion,
      monto_aplicado,
      observaciones,
      cancelar_renovacion,
    } = req.body || {};

    if (!referencia_tipo || referencia_id == null || !fecha_aplicacion || !monto_aplicado) {
      return res.status(400).json({ error: "Campos requeridos: referencia_tipo, referencia_id, fecha_aplicacion, monto_aplicado" });
    }

    const inst = await GastoEstimadoInstancia.findByPk(id);
    if (!inst) return res.status(404).json({ error: "Instancia no encontrada" });
    if (inst.anulado) return res.status(400).json({ error: "Instancia anulada" });

    // 1) Registrar pago
    const pago = await GastoEstimadoPago.create({
      gastoestimado_instancia_id: id,
      referencia_tipo,
      referencia_id,
      formapago_id: formapago_id ?? null,
      fecha_aplicacion,
      monto_aplicado,
      observaciones: observaciones ?? null,
    });

    // 2) Recalcular estado / totales de la instancia
    const resync = await recomputar(id);
    // resync.totalAplicado => suma de pagos de la instancia
    // resync.instancia => instancia con estado actualizado

    // 3) Si pidió cancelar renovación, desactivar la plantilla (mensual)
    let plantillaActualizada = null;
    if (cancelar_renovacion) {
      try {
        const plant = await GastoEstimado.findByPk(resync.instancia.gastoestimado_id);
        if (plant && plant.periodicidad === "mensual" && plant.activo !== false) {
          await plant.update({ activo: false });
          plantillaActualizada = { id: plant.id, activo: plant.activo, periodicidad: plant.periodicidad };
        }
      } catch (e) {
        console.error("Error al desactivar plantilla por cancelar_renovacion:", e);
      }
    }

    // 4) Si la instancia quedó PAGADA, usamos ese total para actualizar el default de la plantilla
    try {
      const instAfter = resync?.instancia;
      if (instAfter?.estado === "pagado") {
        const plant = await GastoEstimado.findByPk(instAfter.gastoestimado_id);
        if (plant && plant.periodicidad === "mensual") {
          // Tomamos el total aplicado sobre la instancia (mejor que el último parcial)
          const nuevoDefault = Number(resync.totalAplicado || 0);
          if (nuevoDefault > 0) {
            await plant.update({ monto_estimado_default: nuevoDefault });
            // por si querés informar este ajuste en la respuesta:
            plantillaActualizada = {
              ...(plantillaActualizada || {}),
              id: plant.id,
              monto_estimado_default: nuevoDefault,
            };
          }
        }
      }

      // 👉 Si en vez de esperar a que quede “pagado” querés actualizar SIEMPRE con el último pago:
      // const plant = await GastoEstimado.findByPk(resync.instancia.gastoestimado_id);
      // if (plant && plant.periodicidad === "mensual") {
      //   await plant.update({ monto_estimado_default: Number(monto_aplicado) });
      // }
    } catch (e) {
      console.error("No se pudo actualizar monto_estimado_default de la plantilla:", e);
    }

    // 5) Rollover (sólo si NO canceló y quedó pagado)
    let rollover = { created: false };
    if (!cancelar_renovacion && resync?.instancia?.estado === "pagado") {
      // IMPORTANTE: pasamos totalAplicado para que la próxima instancia pueda usar este valor
      rollover = await ensureNextMonthlyInstance(resync.instancia, { totalAplicado: resync.totalAplicado });
    }

    return res.json({
      pago,
      ...resync,
      next_instance_created: Boolean(rollover.created),
      next_instance: rollover.next || null,
      plantilla_actualizada: plantillaActualizada,
    });
  } catch (e) {
    console.error("aplicarPago", e);
    return res.status(500).json({ error: "Error aplicando pago" });
  }
}



export async function eliminarPago(req, res) {
  try {
    const { id, pagoId } = req.params;
    const pago = await GastoEstimadoPago.findByPk(pagoId);
    if (!pago) return res.status(404).json({ error: "Pago no encontrado" });
    if (Number(pago.gastoestimado_instancia_id) !== Number(id)) {
      return res.status(400).json({ error: "Pago no pertenece a la instancia" });
    }

    await pago.destroy();
    const resync = await recomputar(id);
    res.json({ ok: true, ...resync });
  } catch (e) {
    console.error("eliminarPago", e);
    res.status(500).json({ error: "Error eliminando pago" });
  }
}

