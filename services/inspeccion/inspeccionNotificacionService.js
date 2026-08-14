import {
  InspeccionNotificacion,
} from "../../models/index.js";

export const crearNotificacion =
  async ({
    inspeccion_id,
    respuesta_id,
    usuario_destino_id,
    sucursal_id,
    titulo,
    mensaje,
    tipo,
  }) => {
    return await InspeccionNotificacion.create({
      inspeccion_id,
      respuesta_id,
      usuario_destino_id,
      sucursal_id,
      titulo,
      mensaje,
      tipo,
    });
  };