import { Op } from "sequelize";
import { CampaniaFidelizacion } from "../../models/fidelizacion/index.js";

export const obtenerCampaniaActivaGeneral = async () => {
  const ahora = new Date();

  return CampaniaFidelizacion.findOne({
    where: {
      estado: "activa",
      fecha_inicio: {
        [Op.lte]: ahora,
      },
      [Op.or]: [
        { fecha_fin: null },
        {
          fecha_fin: {
            [Op.gte]: ahora,
          },
        },
      ],
    },
    order: [
      ["prioridad", "DESC"],
      ["createdAt", "DESC"],
    ],
  });
};