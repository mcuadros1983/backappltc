import {
  CuponCliente,
  ClienteFidelizacion,
  ComercioAsociado,
  CampaniaFidelizacion,
  PremioCliente,
} from "../../models/fidelizacion/index.js";

export const obtenerCuponPorCodigo = async ({ codigo, Op }) => {
  return CuponCliente.findOne({
    where: {
      [Op.or]: [
        { numero_cupon: codigo },
        { token: codigo },
        { codigo_validacion: codigo },
      ],
    },
    include: [
      {
        model: ClienteFidelizacion,
        as: "cliente",
        required: false,
      },
      {
        model: ComercioAsociado,
        as: "comercio",
        required: false,
      },
      {
        model: CampaniaFidelizacion,
        as: "campania",
        required: false,
      },
      {
        model: PremioCliente,
        as: "premio",
        required: false,
      },
    ],
  });
};

export const validarEstadoCupon = (cupon) => {
  if (!cupon) {
    return {
      ok: false,
      status: 404,
      code: "CUPON_NO_ENCONTRADO",
      message: "Cupón no encontrado",
    };
  }

  if (cupon.estado === "usado") {
    return {
      ok: false,
      status: 409,
      code: "CUPON_USADO",
      message: "Este cupón ya fue utilizado",
    };
  }

  if (cupon.estado === "vencido") {
    return {
      ok: false,
      status: 409,
      code: "CUPON_VENCIDO",
      message: "Este cupón está vencido",
    };
  }

  if (cupon.estado === "anulado") {
    return {
      ok: false,
      status: 409,
      code: "CUPON_ANULADO",
      message: "Este cupón fue anulado",
    };
  }

  if (cupon.estado === "cancelado") {
    return {
      ok: false,
      status: 409,
      code: "CUPON_CANCELADO",
      message: "Este cupón fue cancelado",
    };
  }

  if (cupon.fecha_vencimiento) {
    const ahora = new Date();
    const vencimiento = new Date(cupon.fecha_vencimiento);

    if (vencimiento < ahora) {
      return {
        ok: false,
        status: 409,
        code: "CUPON_VENCIDO",
        message: "Este cupón está vencido",
      };
    }
  }

  return {
    ok: true,
    status: 200,
    code: "CUPON_VALIDO",
    message: "Cupón válido para canjear",
  };
};