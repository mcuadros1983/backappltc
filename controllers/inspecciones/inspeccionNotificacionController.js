import {
  InspeccionNotificacion,
  Inspeccion
} from "../../models/index.js";

export const obtenerNotificaciones =
  async (req, res) => {
    try {
      const esAdmin =
        Number(req.user.rol_id) === 1;

      const where = esAdmin
        ? {}
        : {
          sucursal_id:
            req.user.sucursal_id,
        };

      const data =
        await InspeccionNotificacion.findAll({
          where,
          include: [
            {
              model: Inspeccion,
              as: "inspeccion"
            }
          ],
          order: [
            ["createdAt", "DESC"],
          ],
        });

      return res.json(data);
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        message:
          "Error obteniendo notificaciones",
      });
    }
  };

export const marcarLeida =
  async (req, res) => {
    try {
      const notificacion =
        await InspeccionNotificacion.findByPk(
          req.params.id
        );

      if (!notificacion) {
        return res.status(404).json({
          message:
            "No encontrada",
        });
      }

      await notificacion.update({
        leida: true,
        fecha_lectura:
          new Date(),
      });

      return res.json({
        ok: true,
      });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        message:
          "Error",
      });
    }
  };

