import {
  CuponCliente,
  ClienteFidelizacion,
  ComercioAsociado,
  CampaniaFidelizacion,
  PremioCliente,
} from "../../models/fidelizacion/index.js";

export const obtenerCuponPublicoPorToken = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        ok: false,
        message: "Token de cupón requerido",
      });
    }

    const cupon = await CuponCliente.findOne({
      where: { token },
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

    if (!cupon) {
      return res.status(404).json({
        ok: false,
        message: "Cupón no encontrado",
      });
    }

    return res.json({
      ok: true,
      data: cupon,
    });
  } catch (error) {
    console.error("[obtenerCuponPublicoPorToken]", error);

    return res.status(500).json({
      ok: false,
      message: "Error al obtener cupón",
      error: error.message,
    });
  }
};