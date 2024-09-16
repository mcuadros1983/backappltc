import CuentaCorriente from "../../models/gmedias/cuentaCorrienteModel.js";
import Cliente from "../../models/gmedias/clienteModel.js";
import DetalleCuentaCorriente from "../../models/gmedias/detalleCuentaCorrienteModel.js";
import respuesta from "../../utils/respuesta.js";
import Cobranza from "../../models/gmedias/cobranzaModel.js";
import { Venta } from "../../models/gmedias/ventaModel.js";
// import DetalleVenta from "../models/detalleVentaModel.js";
import Producto from "../../models/gmedias/productoModel.js";
import DetalleCobranza from "../../models/gmedias/detalleCobranzaModel.js";

const obtenerOperacionesCuentaCorriente = async (req, res, next) => { 
  try {
    const { clienteId } = req.params;
    let cobranzas = [];

    // Obtener ventas a cuenta corriente
    const ventas = await Venta.findAll({
      where: { cliente_id: clienteId, formaPago_id: 2 }, // Ajusta según tu lógica
      include: [
        {
          model: Producto,
          as: "productos",
        },
      ],
    });
   
    // Obtener cuenta corriente
    const cuentaCorriente = await CuentaCorriente.findOne({
      where: { cliente_id: clienteId },
    });

    // Obtener cobranzas
    if (cuentaCorriente) {
      cobranzas = await Cobranza.findAll({
        include: [
          {
            model: DetalleCobranza,
            as: "detalleCobranza",
          },
        ],
        where: { cuentaCorriente_id: cuentaCorriente.id },
      });
    }

    // Construir la respuesta
    const operacionesCuentaCorriente = {
      ventas,
      cobranzas,
      saldoActual: cuentaCorriente ? cuentaCorriente.saldoActual : 0,
    };

    // Responder con éxito
    res.json(operacionesCuentaCorriente);
  } catch (error) {
    // Manejar errores
    next(error);
  }
};

const obtenerCuentasCorrientes = async (req, res, next) => {
  try {
    const cuentasCorrientes = await CuentaCorriente.findAll({
      include: [
        {
          model: Cliente,
          as: 'cuentaCorriente', // Alias para Cliente
        },
        {
          model: DetalleCuentaCorriente,
          as: 'detalleCuentaCorriente', // Alias para DetalleCuenta
        },
      ],
    });
    res.json(cuentasCorrientes);
  } catch (error) {
    next(error);
  }
};

const obtenerCuentaCorrientePorId = async (req, res, next) => {
  const cuentaCorrienteId = req.params.cuentaCorrienteId;

  try {
    const cuentaCorriente = await CuentaCorriente.findByPk(cuentaCorrienteId, {
      include: [Cliente, DetalleCuenta],
    });

    if (!cuentaCorriente) {
      return respuesta.error(res, "Cuenta corriente no encontrada", 404);
    }

    res.json(cuentaCorriente);
  } catch (error) {
    next(error);
  }
};

const obtenerCuentaCorrientePorIdCliente = async (cliente_id) => {
  // const cuentaCorrienteId = req.params.cuentaCorrienteId;

  try {
    const cuentaCorriente = await CuentaCorriente.findOne({
      where: { cliente_id },
    });
      if (!cuentaCorriente) {
      return;
    }

    return cuentaCorriente;
  } catch (error) {
    next(error);
  }
};

const crearCuentaCorriente = async (clienteId, monto) => {
  // const { clienteId, saldoActual } = req.body;


  try {
    let nuevaCuentaCorriente = await CuentaCorriente.create({
      cliente_id: clienteId,
      saldoActual: monto,
    });

    return nuevaCuentaCorriente;
  } catch (error) {
    next(error);
  }
};

const actualizarCuentaCorrienteIdCliente = async (cliente_id, saldoActual) => {


  try {
    const cuentaCorriente = await CuentaCorriente.findOne({
      where: { cliente_id },
    });

    if (!cuentaCorriente) {
      return;
    }

    cuentaCorriente.cliente_id = cliente_id;
    cuentaCorriente.saldoActual += saldoActual;
    await cuentaCorriente.save();

    return cuentaCorriente;
  } catch (error) {
    console.error(error)
  }
};

const eliminarCuentaCorriente = async (req, res, next) => {
  const cuentaCorrienteId = req.params.cuentaCorrienteId;

  try {
    const cuentaCorriente = await CuentaCorriente.findByPk(cuentaCorrienteId);

    if (!cuentaCorriente) {
      return respuesta.error(res, "Cuenta corriente no encontrada", 404);
    }

    // Eliminar detalles de cuenta asociados a la cuenta corriente
    await DetalleCuenta.destroy({
      where: { cuentaCorrienteId },
    });

    await cuentaCorriente.destroy();

    res.json({ mensaje: "Cuenta corriente eliminada exitosamente" });
  } catch (error) {
    next(error);
  }
};

export {
  obtenerOperacionesCuentaCorriente,
  obtenerCuentasCorrientes,
  obtenerCuentaCorrientePorId,
  obtenerCuentaCorrientePorIdCliente,
  crearCuentaCorriente,
  actualizarCuentaCorrienteIdCliente,
  eliminarCuentaCorriente,
};
