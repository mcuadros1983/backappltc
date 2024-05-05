// formasPagoController.js

import FormaPago from '../../models/gmedias/formaPagoModel.js';
import { Venta } from '../../models/gmedias/ventaModel.js';
import respuesta from '../../utils/respuesta.js';

const obtenerFormasPago = async (req, res, next) => {
  try {
    const formasPago = await FormaPago.findAll();
    res.json(formasPago);
  } catch (error) {
    next(error);
  }
};

const obtenerFormaPagoPorId = async (req, res, next) => {
  const formaPagoId = req.params.formaPagoId;

  try {
    const formaPago = await FormaPago.findByPk(formaPagoId, {
      include: [Venta],
    });

    if (!formaPago) {
      return respuesta.error(res, 'Forma de pago no encontrada', 404);
    }

    res.json(formaPago);
  } catch (error) {
    next(error);
  }
};

const crearFormaPago = async (req, res, next) => {
  const { tipo } = req.body;

  try {
    const nuevaFormaPago = await FormaPago.create({ tipo });
    res.json(nuevaFormaPago);
  } catch (error) {
    next(error);
  }
};

const actualizarFormaPago = async (req, res, next) => {
  const formaPagoId = req.params.formaPagoId;
  const { tipo } = req.body;

  try {
    const formaPago = await FormaPago.findByPk(formaPagoId);

    if (!formaPago) {
      return respuesta.error(res, 'Forma de pago no encontrada', 404);
    }

    formaPago.tipo = tipo;
    await formaPago.save();

    res.json(formaPago);
  } catch (error) {
    next(error);
  }
};

const eliminarFormaPago = async (req, res, next) => {
  const formaPagoId = req.params.formaPagoId;

  try {
    const formaPago = await FormaPago.findByPk(formaPagoId);

    if (!formaPago) {
      return respuesta.error(res, 'Forma de pago no encontrada', 404);
    }

    await formaPago.destroy();

    res.json({ mensaje: 'Forma de pago eliminada con éxito' });
  } catch (error) {
    next(error);
  }
};

export {
  obtenerFormasPago,
  obtenerFormaPagoPorId,
  crearFormaPago,
  actualizarFormaPago,
  eliminarFormaPago,
};
