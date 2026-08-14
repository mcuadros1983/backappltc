import InspeccionPlantilla from "../../models/inspecciones/inspeccionPlantillaModel.js";
import InspeccionCategoria from "../../models/inspecciones/inspeccionCategoriaModel.js";
import InspeccionItem from "../../models/inspecciones/inspeccionItemModel.js";

export const crearCategoria = async (req, res) => {
  try {
    const { plantilla_id, nombre, orden, activo } = req.body;

    if (!plantilla_id) {
      return res.status(400).json({ message: "plantilla_id es obligatorio" });
    }

    if (!nombre || !String(nombre).trim()) {
      return res.status(400).json({ message: "El nombre de la categoría es obligatorio" });
    }

    const plantilla = await InspeccionPlantilla.findByPk(plantilla_id);
    if (!plantilla) {
      return res.status(404).json({ message: "Plantilla no encontrada" });
    }

    const row = await InspeccionCategoria.create({
      plantilla_id,
      nombre: String(nombre).trim(),
      orden: orden || 0,
      activo: activo === undefined ? true : activo,
    });

    res.status(201).json(row);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al crear categoría", error: error.message });
  }
};

export const actualizarCategoria = async (req, res) => {
  try {
    const row = await InspeccionCategoria.findByPk(req.params.id);

    if (!row) {
      return res.status(404).json({ message: "Categoría no encontrada" });
    }

    const camposPermitidos = ["nombre", "orden", "activo"];
    const data = {};

    camposPermitidos.forEach((campo) => {
      if (req.body[campo] !== undefined) data[campo] = req.body[campo];
    });

    if (data.nombre !== undefined && !String(data.nombre).trim()) {
      return res.status(400).json({ message: "El nombre de la categoría es obligatorio" });
    }

    if (data.nombre !== undefined) data.nombre = String(data.nombre).trim();

    await row.update(data);

    res.json(row);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al actualizar categoría", error: error.message });
  }
};

export const desactivarCategoria = async (req, res) => {
  try {
    const row = await InspeccionCategoria.findByPk(req.params.id);

    if (!row) {
      return res.status(404).json({ message: "Categoría no encontrada" });
    }

    await row.update({ activo: false });

    await InspeccionItem.update(
      { activo: false },
      { where: { categoria_id: row.id } }
    );

    res.json({ ok: true, message: "Categoría e ítems desactivados correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al desactivar categoría", error: error.message });
  }
};
