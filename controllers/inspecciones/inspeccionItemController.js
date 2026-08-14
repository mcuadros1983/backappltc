import InspeccionCategoria from "../../models/inspecciones/inspeccionCategoriaModel.js";
import InspeccionItem from "../../models/inspecciones/inspeccionItemModel.js";

const CRITICIDADES = ["BAJA", "MEDIA", "ALTA", "CRITICA"];

export const crearItem = async (req, res) => {
  try {
    const {
      categoria_id,
      descripcion,
      orden,
      peso,
      criticidad,
      requiere_comentario,
      requiere_foto_default,
      activo,
    } = req.body;

    if (!categoria_id) {
      return res.status(400).json({ message: "categoria_id es obligatorio" });
    }

    if (!descripcion || !String(descripcion).trim()) {
      return res.status(400).json({ message: "La descripción del ítem es obligatoria" });
    }

    const categoria = await InspeccionCategoria.findByPk(categoria_id);
    if (!categoria) {
      return res.status(404).json({ message: "Categoría no encontrada" });
    }

    const criticidadFinal = criticidad || "MEDIA";
    if (!CRITICIDADES.includes(criticidadFinal)) {
      return res.status(400).json({ message: "Criticidad inválida" });
    }

    const row = await InspeccionItem.create({
      categoria_id,
      descripcion: String(descripcion).trim(),
      orden: orden || 0,
      peso: peso || 1,
      criticidad: criticidadFinal,
      requiere_comentario: requiere_comentario || false,
      requiere_foto_default: requiere_foto_default || false,
      activo: activo === undefined ? true : activo,
    });

    res.status(201).json(row);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al crear ítem", error: error.message });
  }
};

export const actualizarItem = async (req, res) => {
  try {
    const row = await InspeccionItem.findByPk(req.params.id);

    if (!row) {
      return res.status(404).json({ message: "Ítem no encontrado" });
    }

    const camposPermitidos = [
      "descripcion",
      "orden",
      "peso",
      "criticidad",
      "requiere_comentario",
      "requiere_foto_default",
      "activo",
    ];

    const data = {};

    camposPermitidos.forEach((campo) => {
      if (req.body[campo] !== undefined) data[campo] = req.body[campo];
    });

    if (data.descripcion !== undefined && !String(data.descripcion).trim()) {
      return res.status(400).json({ message: "La descripción del ítem es obligatoria" });
    }

    if (data.descripcion !== undefined) data.descripcion = String(data.descripcion).trim();

    if (data.criticidad !== undefined && !CRITICIDADES.includes(data.criticidad)) {
      return res.status(400).json({ message: "Criticidad inválida" });
    }

    await row.update(data);

    res.json(row);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al actualizar ítem", error: error.message });
  }
};

export const desactivarItem = async (req, res) => {
  try {
    const row = await InspeccionItem.findByPk(req.params.id);

    if (!row) {
      return res.status(404).json({ message: "Ítem no encontrado" });
    }

    await row.update({ activo: false });

    res.json({ ok: true, message: "Ítem desactivado correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al desactivar ítem", error: error.message });
  }
};
