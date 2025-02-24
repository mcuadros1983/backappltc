// cobranzasController.js

import Cliente from "../../models/gmedias/clienteModel.js";
import Cobranza from "../../models/gmedias/cobranzaModel.js";
import CuentaCorriente from "../../models/gmedias/cuentaCorrienteModel.js";
import DetalleCobranza from "../../models/gmedias/detalleCobranzaModel.js";
import { actualizarCuentaCorrienteIdCliente } from "./cuentasCorrientesController.js";
import { registrarDetalleCobranza } from "./detallesCobranzasController.js";
import { sequelize } from "../../config/database.js";

export const registrarCobranza = async (req, res, next) => {
  try {
    // Obtener datos de la solicitud
    const { clienteId, detallesCobranza, descripcionCobranza, formaCobro, montoTotal, fecha } = req.body;

    // Crear la cobranza

    const cobranza = await Cobranza.create({ monto_total: montoTotal, descripcion_cobro: descripcionCobranza, forma_cobro: formaCobro, fecha });

    const detalleCobranza = await registrarDetalleCobranza(
      cobranza.id,
      montoTotal,
      fecha
    );



    // Obtener el cliente y su cuenta corriente
    const cliente = await Cliente.findByPk(clienteId, {
      include: [
        {
          model: CuentaCorriente,
          as: "cuentaCorriente",
        },
      ],
    });


    // Verificar que el cliente y su cuenta corriente existan
    if (cliente && cliente.cuentaCorriente) {
      // Actualizar el saldo en la cuenta corriente
      const nuevoSaldo = cliente.cuentaCorriente.saldoActual - montoTotal;
      await cliente.cuentaCorriente.update({ saldoActual: nuevoSaldo });

      // Asociar la cobranza con la cuenta corriente
      await cobranza.setCuentaCorriente(cliente.cuentaCorriente);
    
    } else {
      console.error("Cliente o cuenta corriente no encontrados");
    }

    res.json(cobranza);
  } catch (error) {
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
    const { monto_total, forma_cobro , descripcion_cobro } = req.body;

    // Iniciar transacción
    transaction = await sequelize.transaction();

    // Obtener la cobranza a actualizar
    const cobranzaActualizada = await Cobranza.findByPk(cobranzaId, {
      transaction,
    });

    if (!cobranzaActualizada) {
      throw new Error("Cobranza no encontrada");
    }

    // Calcular la diferencia en el monto_total
    const diferenciaMonto = monto_total - cobranzaActualizada.monto_total;
    // Actualizar el monto_total en la cobranza
    await cobranzaActualizada.update({ monto_total, forma_cobro, descripcion_cobro }, { transaction });

    // Obtener la cuenta corriente asociada a la cobranza a través del modelo de Cliente
    const cuentaCorriente = await CuentaCorriente.findOne({
      include: [
        {
          model: Cobranza,
          as: "cobranzas",
          where: { id: cobranzaId },
        },
      ],
    });

    if (!cuentaCorriente) {
      throw new Error("CuentaCorriente no encontrados");
    }

    // Actualizar el saldo en la cuenta corriente
    const nuevoSaldo = cuentaCorriente.saldoActual - diferenciaMonto;
    await cuentaCorriente.update({ saldoActual: nuevoSaldo }, { transaction });

    await DetalleCobranza.destroy({
      where: { cobranza_id: cobranzaId },
      transaction,
    });


    const detalleCobranza = await registrarDetalleCobranza(
      cobranzaId,
      monto_total
    );


    await transaction.commit();
    res.json(cobranzaActualizada);
  } catch (error) {
    // Rollback de la transacción en caso de error
    if (transaction) {
      await transaction.rollback();
    }
    next(error);
  }
};

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
