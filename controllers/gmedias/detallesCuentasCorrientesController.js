// detallesCuentasCorrientesController.js

import DetalleCuentaCorriente from '../../models/gmedias/detalleCuentaCorrienteModel.js';
import CuentaCorriente from '../../models/gmedias/cuentaCorrienteModel.js';
import { Venta } from '../../models/gmedias/ventaModel.js';
import respuesta from '../../utils/respuesta.js';

const obtenerDetallesCuentasCorrientes = async (req, res, next) => {
  try {
    const detallesCuentasCorrientes = await DetalleCuentaCorriente.findAll({
      include: [CuentaCorriente, Venta],
    });
    res.json(detallesCuentasCorrientes);
  } catch (error) {
    next(error);
  }
};

const obtenerDetalleCuentaCorrientePorId = async (req, res, next) => {
  const detalleCuentaCorrienteId = req.params.detalleCuentaCorrienteId;

  try {
    const detalleCuentaCorriente = await DetalleCuentaCorriente.findByPk(detalleCuentaCorrienteId, {
      include: [CuentaCorriente, Venta],
    });

    if (!detalleCuentaCorriente) {
      return respuesta.error(res, 'Detalle de cuenta corriente no encontrado', 404);
    }

    res.json(detalleCuentaCorriente);
  } catch (error) {
    next(error);
  }
};

const crearDetalleCuentaCorriente = async (cuentaCorriente_id, monto) => {

  try {
    const nuevoDetalleCuentaCorriente = await DetalleCuentaCorriente.create({
      cuentaCorriente_id,
      monto,
    });

    return nuevoDetalleCuentaCorriente;
  } catch (error) {
    next(error);
  }
};

const actualizarDetalleCuentaCorriente = async (req, res, next) => {
  const detalleCuentaCorrienteId = req.params.detalleCuentaCorrienteId;
  const { cuentaCorrienteId, ventaId, monto, fecha } = req.body;

  try {
    const detalleCuentaCorriente = await DetalleCuentaCorriente.findByPk(detalleCuentaCorrienteId);

    if (!detalleCuentaCorriente) {
      return respuesta.error(res, 'Detalle de cuenta corriente no encontrado', 404);
    }

    detalleCuentaCorriente.cuentaCorrienteId = cuentaCorrienteId;
    detalleCuentaCorriente.ventaId = ventaId;
    detalleCuentaCorriente.monto = monto;
    detalleCuentaCorriente.fecha = fecha;
    await detalleCuentaCorriente.save();

    res.json(detalleCuentaCorriente);
  } catch (error) {
    next(error);
  }
};

const eliminarDetalleCuentaCorriente = async (req, res, next) => {
  const detalleCuentaCorrienteId = req.params.detalleCuentaCorrienteId;

  try {
    const detalleCuentaCorriente = await DetalleCuentaCorriente.findByPk(detalleCuentaCorrienteId);

    if (!detalleCuentaCorriente) {
      return respuesta.error(res, 'Detalle de cuenta corriente no encontrado', 404);
    }

    await detalleCuentaCorriente.destroy();

    res.json({ mensaje: 'Detalle de cuenta corriente eliminado con éxito' });
  } catch (error) {
    next(error);
  }
};

export {
  obtenerDetallesCuentasCorrientes,
  obtenerDetalleCuentaCorrientePorId,
  crearDetalleCuentaCorriente,
  actualizarDetalleCuentaCorriente,
  eliminarDetalleCuentaCorriente,
};
