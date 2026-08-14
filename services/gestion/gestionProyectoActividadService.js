import {
  GestionProyectoActividad
} from "../../models/index.js";

const crear = async ({
  proyecto_id,
  usuario_id,
  tipo,
  comentario = null,
  metadata = null,
  transaction = null,
}) => {

  return GestionProyectoActividad.create(
    {
      proyecto_id,
      usuario_id,
      tipo,
      comentario,
      metadata,
    },
    { transaction }
  );
};

export default {
  crear,
};