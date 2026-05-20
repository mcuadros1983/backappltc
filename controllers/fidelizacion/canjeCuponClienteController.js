import { Op } from "sequelize";
import { sequelize } from "../../config/database.js";
import {
  CuponCliente,
  CanjeCuponCliente,
  PremioCliente,
  PuntoComercioMovimiento,
} from "../../models/fidelizacion/index.js";

import {
  obtenerCuponPorCodigo,
  validarEstadoCupon,
} from "../../services/fidelizacion/couponValidationService.js";

import {
  acreditarPuntosPorCanje,
  obtenerSaldoPuntosComercio,
} from "../../services/fidelizacion/pointsService.js";

export const validarCuponAdmin = async (req, res) => {
  try {
    const { codigo } = req.body;

    if (!codigo) {
      return res.status(400).json({
        ok: false,
        message: "Debe ingresar número de cupón, token o código de validación",
      });
    }

    const cupon = await obtenerCuponPorCodigo({
      codigo: String(codigo).trim(),
      Op,
    });

    const validacion = validarEstadoCupon(cupon);

    if (!validacion.ok) {
      return res.status(validacion.status).json({
        ok: false,
        code: validacion.code,
        message: validacion.message,
        data: cupon,
      });
    }

    return res.json({
      ok: true,
      code: validacion.code,
      message: validacion.message,
      data: cupon,
    });
  } catch (error) {
    console.error("[validarCuponAdmin]", error);

    return res.status(500).json({
      ok: false,
      message: "Error al validar cupón",
      error: error.message,
    });
  }
};

export const canjearCuponAdmin = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const { sucursal_id, observaciones } = req.body;

    const usuario_id = req.user?.id || req.usuario?.id || req.user?.usuario || null;

    if (!sucursal_id) {
      await transaction.rollback();
      return res.status(400).json({
        ok: false,
        message: "Debe indicar la sucursal del canje",
      });
    }

    if (!usuario_id) {
      await transaction.rollback();
      return res.status(401).json({
        ok: false,
        message: "No se pudo identificar el usuario que realiza el canje",
      });
    }

    const cupon = await CuponCliente.findByPk(id, {
      include: [
        {
          model: PremioCliente,
          as: "premio",
          required: true,
        },
      ],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    const validacion = validarEstadoCupon(cupon);

    if (!validacion.ok) {
      await transaction.rollback();

      return res.status(validacion.status).json({
        ok: false,
        code: validacion.code,
        message: validacion.message,
      });
    }

    const canjeExistente = await CanjeCuponCliente.findOne({
      where: {
        cupon_id: cupon.id,
        estado: "confirmado",
      },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (canjeExistente) {
      await transaction.rollback();

      return res.status(409).json({
        ok: false,
        code: "CUPON_YA_CANJEADO",
        message: "Este cupón ya tiene un canje confirmado",
      });
    }

    const canje = await CanjeCuponCliente.create(
      {
        cupon_id: cupon.id,
        cliente_id: cupon.cliente_id,
        comercio_id: cupon.comercio_id,
        premio_cliente_id: cupon.premio_cliente_id,
        sucursal_id,
        usuario_id,
        fecha_canje: new Date(),
        estado: "confirmado",
        observaciones: observaciones || null,
      },
      { transaction }
    );

    await cupon.update(
      {
        estado: "usado",
      },
      { transaction }
    );

    const movimientoPuntos = await acreditarPuntosPorCanje({
      comercio_id: cupon.comercio_id,
      cupon_id: cupon.id,
      canje_cupon_id: canje.id,
      premio: cupon.premio,
      usuario_id,
      transaction,
    });

    await transaction.commit();

    return res.status(201).json({
      ok: true,
      message: "Cupón canjeado correctamente",
      data: {
        canje,
        cupon: {
          id: cupon.id,
          numero_cupon: cupon.numero_cupon,
          estado: "usado",
        },
        puntos_acreditados: movimientoPuntos
          ? movimientoPuntos.puntos
          : 0,
        movimiento_puntos: movimientoPuntos,
      },
    });
  } catch (error) {
    await transaction.rollback();

    console.error("[canjearCuponAdmin]", error);

    return res.status(500).json({
      ok: false,
      message: "Error al canjear cupón",
      error: error.message,
    });
  }
};

export const obtenerPuntosComercioAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const movimientos = await PuntoComercioMovimiento.findAll({
      where: {
        comercio_id: id,
      },
      order: [["createdAt", "DESC"]],
    });

    const saldo = await obtenerSaldoPuntosComercio(id);

    return res.json({
      ok: true,
      data: {
        comercio_id: Number(id),
        saldo,
        movimientos,
      },
    });
  } catch (error) {
    console.error("[obtenerPuntosComercioAdmin]", error);

    return res.status(500).json({
      ok: false,
      message: "Error al obtener puntos del comercio",
      error: error.message,
    });
  }
};