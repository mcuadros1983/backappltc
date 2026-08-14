import InspeccionPlantilla from "../../models/inspecciones/inspeccionPlantillaModel.js";
import InspeccionCategoria from "../../models/inspecciones/inspeccionCategoriaModel.js";
import InspeccionItem from "../../models/inspecciones/inspeccionItemModel.js";

const normalizarBoolean = (value, defaultValue = true) => {
  if (value === undefined || value === null || value === "") return defaultValue;
  if (typeof value === "boolean") return value;
  return ["true", "1", "si", "sí"].includes(String(value).toLowerCase());
};

export const listarPlantillas = async (req, res) => {
  try {
    const { activo } = req.query;

    const where = {};
    if (activo !== undefined) {
      where.activo = normalizarBoolean(activo);
    }

    const rows = await InspeccionPlantilla.findAll({
      where,
      order: [["nombre", "ASC"], ["version", "DESC"]],
    });

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al listar plantillas", error: error.message });
  }
};

export const obtenerPlantilla = async (req, res) => {
  try {
    const row = await InspeccionPlantilla.findByPk(req.params.id);

    if (!row) {
      return res.status(404).json({ message: "Plantilla no encontrada" });
    }

    res.json(row);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener plantilla", error: error.message });
  }
};

export const obtenerPlantillaCompleta = async (req, res) => {
  try {
    const row = await InspeccionPlantilla.findByPk(req.params.id, {
      include: [
        {
          model: InspeccionCategoria,
          as: "categorias",
          where: { activo: true },
          required: false,
          include: [
            {
              model: InspeccionItem,
              as: "items",
              where: { activo: true },
              required: false,
            },
          ],
        },
      ],
      order: [
        [{ model: InspeccionCategoria, as: "categorias" }, "orden", "ASC"],
        [{ model: InspeccionCategoria, as: "categorias" }, { model: InspeccionItem, as: "items" }, "orden", "ASC"],
      ],
    });

    if (!row) {
      return res.status(404).json({ message: "Plantilla no encontrada" });
    }

    res.json(row);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener plantilla completa", error: error.message });
  }
};

export const crearPlantilla = async (req, res) => {
  try {
    const { nombre, descripcion, version, activo, empresa_id } = req.body;

    if (!nombre || !String(nombre).trim()) {
      return res.status(400).json({ message: "El nombre de la plantilla es obligatorio" });
    }

    const row = await InspeccionPlantilla.create({
      nombre: String(nombre).trim(),
      descripcion: descripcion || null,
      version: version || 1,
      activo: activo === undefined ? true : activo,
      empresa_id: empresa_id || null,
    });

    res.status(201).json(row);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al crear plantilla", error: error.message });
  }
};

export const actualizarPlantilla = async (req, res) => {
  try {
    const row = await InspeccionPlantilla.findByPk(req.params.id);

    if (!row) {
      return res.status(404).json({ message: "Plantilla no encontrada" });
    }

    const camposPermitidos = ["nombre", "descripcion", "version", "activo", "empresa_id"];
    const data = {};

    camposPermitidos.forEach((campo) => {
      if (req.body[campo] !== undefined) data[campo] = req.body[campo];
    });

    if (data.nombre !== undefined && !String(data.nombre).trim()) {
      return res.status(400).json({ message: "El nombre de la plantilla es obligatorio" });
    }

    if (data.nombre !== undefined) data.nombre = String(data.nombre).trim();

    await row.update(data);

    res.json(row);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al actualizar plantilla", error: error.message });
  }
};

export const desactivarPlantilla = async (req, res) => {
  try {
    const row = await InspeccionPlantilla.findByPk(req.params.id);

    if (!row) {
      return res.status(404).json({ message: "Plantilla no encontrada" });
    }

    await row.update({ activo: false });

    res.json({ ok: true, message: "Plantilla desactivada correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al desactivar plantilla", error: error.message });
  }
};
