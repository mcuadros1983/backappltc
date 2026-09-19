import PrestamoEmpleado from "../../models/sueldoempleado/prestamoEmpleadoModel.js";
import AdicionalVariable from "../../models/sueldoempleado/adicionalvariable.js";

/**
 * Recalcula el saldo de un préstamo a partir de todos los
 * AdicionalVariable asociados al préstamo.
 *
 * Los descuentos de préstamo se almacenan como montos negativos.
 *
 * saldo = monto_original - total_pagado
 */
export const recalcularSaldoPrestamo = async (
  prestamoId,
  transaction = null
) => {
  const id = Number(prestamoId);

  if (!id) {
    throw new Error("prestamoId inválido.");
  }

  const prestamo = await PrestamoEmpleado.findByPk(id, {
    transaction,
    lock: transaction ? transaction.LOCK.UPDATE : undefined,
  });

  if (!prestamo) {
    throw new Error(`Préstamo ${id} no encontrado.`);
  }

  const cuotas = await AdicionalVariable.findAll({
    where: {
      prestamo_id: id,
    },
    attributes: [
      "id",
      "monto",
      "empleado_id",
      "periodo",
      "periodo_id",
    ],
    transaction,
  });

  let totalPagado = 0;

  for (const cuota of cuotas) {
    const monto = Number(cuota.monto || 0);

    // Las cuotas de préstamo deben ser descuentos.
    // Por seguridad solamente computamos montos negativos.
    if (monto < 0) {
      totalPagado += Math.abs(monto);
    }
  }

  const montoOriginal = Number(prestamo.monto_original || 0);

  let saldo = montoOriginal - totalPagado;

  // Evitamos residuos decimales.
  saldo = Math.round((saldo + Number.EPSILON) * 100) / 100;

  if (saldo < 0) {
    throw new Error(
      `Las cuotas del préstamo ${id} superan el monto original. ` +
      `Original: ${montoOriginal}. Pagado: ${totalPagado}.`
    );
  }

  let estado = prestamo.estado;

  // Un préstamo anulado conserva ese estado.
  if (estado !== "anulado") {
    if (saldo <= 0) {
      estado = "cancelado";
    } else if (totalPagado > 0) {
      estado = "activo";
    } else {
      estado = "pendiente";
    }
  }

  await prestamo.update(
    {
      saldo,
      estado,
    },
    {
      transaction,
    }
  );

  return {
    prestamo,
    monto_original: montoOriginal,
    total_pagado: totalPagado,
    saldo,
    estado,
    cantidad_cuotas: cuotas.length,
  };
};