import { Op } from "sequelize";
import { CuponCliente } from "../../models/fidelizacion/index.js";

export const expireCouponsJob = async () => {
  try {
    const ahora = new Date();

    const [totalActualizados] = await CuponCliente.update(
      {
        estado: "vencido",
      },
      {
        where: {
          estado: "disponible",
          fecha_vencimiento: {
            [Op.ne]: null,
            [Op.lt]: ahora,
          },
        },
      }
    );

    console.log(
      `[FIDELIZACION][expireCouponsJob] Cupones vencidos actualizados: ${totalActualizados}`
    );

    return {
      ok: true,
      totalActualizados,
    };
  } catch (error) {
    console.error("[FIDELIZACION][expireCouponsJob]", error);

    return {
      ok: false,
      error: error.message,
    };
  }
};