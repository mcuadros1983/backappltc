import CategoriaIngreso from "../../models/tesoreria/categoriaIngreso.js";

// Crear categoría
export const crearCategoriaIngreso = async (req, res) => {
  try {
    const categoria = await CategoriaIngreso.create(req.body);
    res.status(201).json(categoria);
  } catch (error) {
    res.status(500).json({ error: "Error al crear la categoría", detalle: error.message });
  }
};

// Listar todas las categorías
export const listarCategoriasIngreso = async (req, res) => {
  try {
    const categorias = await CategoriaIngreso.findAll();
    res.status(200).json(categorias);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener las categorías" });
  }
};

// Obtener por ID
export const obtenerCategoriaIngresoPorId = async (req, res) => {
  try {
    const categoria = await CategoriaIngreso.findByPk(req.params.id);
    if (!categoria) return res.status(404).json({ error: "Categoría no encontrada" });
    res.status(200).json(categoria);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener la categoría" });
  }
};

// Actualizar categoría
export const actualizarCategoriaIngreso = async (req, res) => {
  try {
    const categoria = await CategoriaIngreso.findByPk(req.params.id);
    if (!categoria) return res.status(404).json({ error: "Categoría no encontrada" });
    await categoria.update(req.body);
    res.status(200).json(categoria);
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar la categoría" });
  }
};

// Eliminar categoría
export const eliminarCategoriaIngreso = async (req, res) => {
  try {
    const categoria = await CategoriaIngreso.findByPk(req.params.id);
    if (!categoria) return res.status(404).json({ error: "Categoría no encontrada" });
    await categoria.destroy();
    res.status(200).json({ mensaje: "Categoría eliminada correctamente" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar la categoría" });
  }
};
