import { Op } from "sequelize";
import { PuntoComercioMovimiento } from "../../models/fidelizacion/index.js";

export const expireCommercePointsJob = async () => {
  try {
    const ahora = new Date();

    const [totalActualizados] = await PuntoComercioMovimiento.update(
      {
        estado: "vencido",
      },
      {
        where: {
          estado: "activo",
          fecha_vencimiento: {
            [Op.ne]: null,
            [Op.lt]: ahora,
          },
          tipo_movimiento: "acreditacion",
        },
      }
    );

    console.log(
      `[FIDELIZACION][expireCommercePointsJob] Puntos vencidos: ${totalActualizados}`
    );

    return {
      ok: true,
      totalActualizados,
    };
  } catch (error) {
    console.error("[FIDELIZACION][expireCommercePointsJob]", error);

    return {
      ok: false,
      error: error.message,
    };
  }
};