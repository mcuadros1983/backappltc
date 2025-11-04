import AdicionalVariableTipo from "../../models/sueldoempleado/adicionalvariabletipo.js";


export const listarTiposVariables = async (_req, res) => {
  try {
    const rows = await AdicionalVariableTipo.findAll({ order: [["id", "ASC"]] });
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: "Error al listar tipos" });
  }
};

const CATEGORIAS_VALIDAS = ["adicional", "descuento"];

export const crearTipoVariable = async (req, res) => {
  try {
    const { descripcion, categoria } = req.body || {};

    if (!descripcion || !descripcion.trim()) {
      return res.status(400).json({ error: "La descripción es requerida" });
    }

    // Normalizar categoría: "" -> null
    let cat = categoria;
    if (cat === "") cat = null;

    // Validar si viene informada
    if (cat != null && !CATEGORIAS_VALIDAS.includes(cat)) {
      return res.status(400).json({ error: "Categoría inválida (use 'adicional' o 'descuento')" });
    }

    const row = await AdicionalVariableTipo.create({
      descripcion: descripcion.trim(),
      categoria: cat ?? null,
    });

    res.status(201).json(row);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error al crear el tipo" });
  }
};

export const actualizarTipoVariable = async (req, res) => {
  try {
    const { id } = req.params;
    const { descripcion, categoria } = req.body || {};

    const row = await AdicionalVariableTipo.findByPk(id);
    if (!row) return res.status(404).json({ error: "No encontrado" });

    // Validaciones
    if (descripcion != null && !String(descripcion).trim()) {
      return res.status(400).json({ error: "La descripción no puede ser vacía" });
    }

    let cat = categoria;
    if (cat === "") cat = null;
    if (cat != null && !CATEGORIAS_VALIDAS.includes(cat)) {
      return res.status(400).json({ error: "Categoría inválida (use 'adicional' o 'descuento')" });
    }

    await row.update({
      ...(descripcion != null ? { descripcion: String(descripcion).trim() } : {}),
      ...(categoria !== undefined ? { categoria: cat ?? null } : {}),
    });

    res.json(row);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error al actualizar el tipo" });
  }
};

export const eliminarTipoVariable = async (req, res) => {
  const { id } = req.params;
  const count = await AdicionalVariableTipo.destroy({ where: { id } });
  res.json({ deleted: count });
};
