import { Op } from "sequelize";
import { CampaniaFidelizacion } from "../../models/fidelizacion/index.js";

export const finishCampaignsJob = async () => {
  try {
    const ahora = new Date();

    const [totalActualizadas] = await CampaniaFidelizacion.update(
      {
        estado: "finalizada",
      },
      {
        where: {
          estado: "activa",
          fecha_fin: {
            [Op.ne]: null,
            [Op.lt]: ahora,
          },
        },
      }
    );

    console.log(
      `[FIDELIZACION][finishCampaignsJob] Campañas finalizadas: ${totalActualizadas}`
    );

    return {
      ok: true,
      totalActualizadas,
    };
  } catch (error) {
    console.error("[FIDELIZACION][finishCampaignsJob]", error);

    return {
      ok: false,
      error: error.message,
    };
  }
};