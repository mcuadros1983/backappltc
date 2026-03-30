// cobranzasController.js

import Cliente from "../../models/gmedias/clienteModel.js";
import Cobranza from "../../models/gmedias/cobranzaModel.js";
import CuentaCorriente from "../../models/gmedias/cuentaCorrienteModel.js";
import DetalleCobranza from "../../models/gmedias/detalleCobranzaModel.js";
import { actualizarCuentaCorrienteIdCliente } from "./cuentasCorrientesController.js";
import { registrarDetalleCobranza } from "./detallesCobranzasController.js";
import { sequelize } from "../../config/database.js";


export const registrarCobranza = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const {
      clienteId,
      detallesCobranza = [], // opcional: array de detalles
      descripcionCobranza,
      formaCobro,
      montoTotal,
      fecha,
    } = req.body;

    const monto = Number(montoTotal);
    if (!Number.isFinite(monto) || monto === 0) {
      await t.rollback();
      return res.status(400).json({ error: 'Monto inválido. Debe ser un número distinto de 0' });
    }

    // 1) Cliente (lock para concurrencia)
    const cliente = await Cliente.findByPk(clienteId, {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!cliente) {
      await t.rollback();
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    // 2) Cuenta Corriente: si no existe, crearla con saldo 0
    const [cc] = await CuentaCorriente.findOrCreate({
      where: { cliente_id: cliente.id },
      defaults: { cliente_id: cliente.id, saldoActual: 0, fecha },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    // Si NO querés permitir saldo negativo, validá antes de descontar:
    // if ((cc.saldoActual ?? 0) - monto < 0) {
    //   await t.rollback();
    //   return res.status(409).json({ error: 'La cobranza excede el saldo de la cuenta corriente' });
    // }

    // 3) Crear Cobranza vinculada a la CC
    const cobranza = await Cobranza.create(
      {
        monto_total: monto,
        descripcion_cobro: descripcionCobranza,
        forma_cobro: formaCobro,
        fecha,
        cuentaCorriente_id: cc.id, // FK directa
      },
      { transaction: t }
    );

    // 4) Detalles de cobranza
    if (Array.isArray(detallesCobranza) && detallesCobranza.length > 0) {
      for (const det of detallesCobranza) {
        const m = Number(det.monto ?? monto);
        if (!Number.isFinite(m) || m === 0) {
          await t.rollback();
          return res.status(400).json({ error: 'Monto de detalle inválido. Debe ser distinto de 0' });
        }
        await registrarDetalleCobranza(cobranza.id, m, det.fecha ?? fecha, t);
      }
    } else {
      await registrarDetalleCobranza(cobranza.id, monto, fecha, t);
    }

    // 5) Descontar saldo (paga deuda → saldo baja)
    await cc.decrement('saldoActual', { by: monto, transaction: t });

    // Refrescamos el saldo para responder con el valor actualizado
    await cc.reload({ transaction: t });

    await t.commit();
    return res.json({
      cobranza,
      cuentaCorriente: {
        id: cc.id,
        saldoActual: cc.saldoActual,
      },
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};


export const obtenerCobranzas = async (req, res, next) => {
  try {
    const cobranzas = await Cobranza.findAll();
    res.json(cobranzas);
  } catch (error) {
    next(error);
  }
};

export const obtenerCobranzaPorId = async (req, res, next) => {
  try {
    const { cobranzaId } = req.params;
    const cobranza = await Cobranza.findByPk(cobranzaId);
    res.json(cobranza);
  } catch (error) {
    next(error);
  }
};

export const actualizarCobranza = async (req, res, next) => {
  let transaction;

  try {
    const { cobranzaId } = req.params;
    const { fecha, monto_total, forma_cobro, descripcion_cobro } = req.body;

    const montoNum = Number(monto_total);
    if (!Number.isFinite(montoNum) || montoNum === 0) {
      throw new Error("monto_total inválido: debe ser un número distinto de 0");
    }

    if (fecha && !/^\d{4}-\d{2}-\d{2}$/.test(String(fecha))) {
      throw new Error("fecha inválida (usar YYYY-MM-DD)");
    }

    transaction = await sequelize.transaction();

    const cobranzaActualizada = await Cobranza.findByPk(cobranzaId, { transaction });
    if (!cobranzaActualizada) throw new Error("Cobranza no encontrada");

    const diferenciaMonto = montoNum - Number(cobranzaActualizada.monto_total || 0);

    await cobranzaActualizada.update(
      { fecha, monto_total: montoNum, forma_cobro, descripcion_cobro },
      { transaction }
    );

    const cuentaCorriente = await CuentaCorriente.findOne({
      include: [{ model: Cobranza, as: "cobranzas", where: { id: cobranzaId } }],
      transaction,
    });

    if (!cuentaCorriente) throw new Error("CuentaCorriente no encontrada");

    const nuevoSaldo = Number(cuentaCorriente.saldoActual || 0) - diferenciaMonto;
    await cuentaCorriente.update({ saldoActual: nuevoSaldo }, { transaction });

    await DetalleCobranza.destroy({ where: { cobranza_id: cobranzaId }, transaction });

    await registrarDetalleCobranza(cobranzaId, montoNum, fecha, transaction);

    await transaction.commit();
    res.json(cobranzaActualizada);
  } catch (error) {
    if (transaction) await transaction.rollback();
    next(error);
  }
};

// export const actualizarCobranza = async (req, res, next) => {
//   let transaction;

//   try {
//     const { cobranzaId } = req.params;
//     const { fecha, monto_total, forma_cobro , descripcion_cobro } = req.body;

//     // Iniciar transacción
//     transaction = await sequelize.transaction();

//     // Obtener la cobranza a actualizar
//     const cobranzaActualizada = await Cobranza.findByPk(cobranzaId, {
//       transaction,
//     });

//     if (!cobranzaActualizada) {
//       throw new Error("Cobranza no encontrada");
//     }

//     // Calcular la diferencia en el monto_total
//     const diferenciaMonto = monto_total - cobranzaActualizada.monto_total;
//     // Actualizar el monto_total en la cobranza
//     await cobranzaActualizada.update({ fecha, monto_total, forma_cobro, descripcion_cobro }, { transaction });

//     // Obtener la cuenta corriente asociada a la cobranza a través del modelo de Cliente
//     const cuentaCorriente = await CuentaCorriente.findOne({
//       include: [
//         {
//           model: Cobranza,
//           as: "cobranzas",
//           where: { id: cobranzaId },
//         },
//       ],
//     });

//     if (!cuentaCorriente) {
//       throw new Error("CuentaCorriente no encontrados");
//     }

//     // Actualizar el saldo en la cuenta corriente
//     const nuevoSaldo = cuentaCorriente.saldoActual - diferenciaMonto;
//     await cuentaCorriente.update({ saldoActual: nuevoSaldo }, { transaction });

//     await DetalleCobranza.destroy({
//       where: { cobranza_id: cobranzaId },
//       transaction,
//     });


//     const detalleCobranza = await registrarDetalleCobranza(
//       cobranzaId,
//       monto_total
//     );


//     await transaction.commit();
//     res.json(cobranzaActualizada);
//   } catch (error) {
//     // Rollback de la transacción en caso de error
//     if (transaction) {
//       await transaction.rollback();
//     }
//     next(error);
//   }
// };


export const eliminarCobranza = async (req, res, next) => {
  try {
    const { cobranzaId } = req.params;
    const cobranza = await Cobranza.findByPk(cobranzaId);

    const cuentaCorriente = await CuentaCorriente.findOne({
      include: [
        {
          model: Cobranza,
          as: "cobranzas",
          where: { id: cobranzaId },
        },
      ],
    });
    await actualizarCuentaCorrienteIdCliente(
      cuentaCorriente.cliente_id,
      cobranza.monto_total
    );

    // Eliminar la cobranza y sus detalles asociados
    await Cobranza.destroy({
      where: { id: cobranzaId },
      cascade: true,
    });

    res.json({ mensaje: "Cobranza eliminada con éxito" });
  } catch (error) {
    next(error);
  }
};
