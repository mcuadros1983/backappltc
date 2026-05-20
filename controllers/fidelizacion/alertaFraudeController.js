import {
  AlertaFraude,
  ComercioAsociado,
  ClienteFidelizacion,
  ParticipacionCliente,
} from "../../models/fidelizacion/index.js";

export const listarAlertasFraude = async (req, res) => {
  try {
    const { estado, nivel_riesgo, comercio_id, tipo_alerta } = req.query;

    const where = {};

    if (estado) where.estado = estado;
    if (nivel_riesgo) where.nivel_riesgo = nivel_riesgo;
    if (comercio_id) where.comercio_id = comercio_id;
    if (tipo_alerta) where.tipo_alerta = tipo_alerta;

    const alertas = await AlertaFraude.findAll({
      where,
      include: [
        {
          model: ComercioAsociado,
          as: "comercio",
          required: false,
          attributes: ["id", "nombre_fantasia", "domicilio"],
        },
        {
          model: ClienteFidelizacion,
          as: "cliente",
          required: false,
          attributes: ["id", "nombre", "telefono"],
        },
        {
          model: ParticipacionCliente,
          as: "participacion",
          required: false,
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: 300,
    });

    return res.json({
      ok: true,
      data: alertas,
    });
  } catch (error) {
    console.error("[listarAlertasFraude]", error);

    return res.status(500).json({
      ok: false,
      message: "Error al listar alertas antifraude",
      error: error.message,
    });
  }
};

export const actualizarEstadoAlertaFraude = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, observaciones_resolucion } = req.body;

    const estadosValidos = ["pendiente", "en_revision", "resuelta", "descartada"];

    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({
        ok: false,
        message: "Estado inválido",
      });
    }

    const alerta = await AlertaFraude.findByPk(id);

    if (!alerta) {
      return res.status(404).json({
        ok: false,
        message: "Alerta no encontrada",
      });
    }

    const userId = req.user?.id || req.usuario?.id || null;

    await alerta.update({
      estado,
      observaciones_resolucion:
        observaciones_resolucion ?? alerta.observaciones_resolucion,
      resuelto_por: ["resuelta", "descartada"].includes(estado)
        ? userId
        : alerta.resuelto_por,
      fecha_resolucion: ["resuelta", "descartada"].includes(estado)
        ? new Date()
        : alerta.fecha_resolucion,
    });

    return res.json({
      ok: true,
      message: "Alerta actualizada correctamente",
      data: alerta,
    });
  } catch (error) {
    console.error("[actualizarEstadoAlertaFraude]", error);

    return res.status(500).json({
      ok: false,
      message: "Error al actualizar alerta",
      error: error.message,
    });
  }
};