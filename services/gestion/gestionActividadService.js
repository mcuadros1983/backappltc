import { GestionTareaActividad } from "../../models/index.js";

const crear = async ({ tarea_id, usuario_id, tipo, comentario, estado_anterior, estado_nuevo, metadata, transaction }) => {
  return GestionTareaActividad.create({
    tarea_id,
    usuario_id: usuario_id || null,
    tipo,
    comentario: comentario || null,
    estado_anterior: estado_anterior || null,
    estado_nuevo: estado_nuevo || null,
    metadata: metadata || null,
  }, { transaction });
};

export default { crear };
