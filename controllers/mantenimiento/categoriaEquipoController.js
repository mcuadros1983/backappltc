// controllers/categoriaEquipoController.js
import CategoriaEquipo  from "../../models/mantenimiento/categoriaEquipoModel.js";

// Crear una nueva categoría
export const crearCategoriaEquipo = async (req, res) => {
  try {
    const categoria = await CategoriaEquipo.create(req.body);
    res.status(201).json(categoria);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear la categoría de equipo' });
  }
};

// Listar todas las categorías
export const listarCategoriasEquipo = async (req, res) => {
  try {
    const categorias = await CategoriaEquipo.findAll();
    res.status(200).json(categorias);
  } catch (error) {
    res.status(500).json({ error: 'Error al listar las categorías de equipo' });
  }
};

// Obtener una categoría por ID
export const obtenerCategoriaEquipoPorId = async (req, res) => {
  try {
    const categoria = await CategoriaEquipo.findByPk(req.params.id);
    if (!categoria) {
      return res.status(404).json({ error: 'Categoría de equipo no encontrada' });
    }
    res.status(200).json(categoria);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener la categoría de equipo' });
  }
};

// Actualizar una categoría por ID
export const actualizarCategoriaEquipo = async (req, res) => {
  try {
    const categoria = await CategoriaEquipo.findByPk(req.params.id);
    if (!categoria) {
      return res.status(404).json({ error: 'Categoría de equipo no encontrada' });
    }
    await categoria.update(req.body);
    res.status(200).json(categoria);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar la categoría de equipo' });
  }
};

// Eliminar una categoría por ID
export const eliminarCategoriaEquipo = async (req, res) => {
  try {
    const categoria = await CategoriaEquipo.findByPk(req.params.id);
    if (!categoria) {
      return res.status(404).json({ error: 'Categoría de equipo no encontrada' });
    }
    await categoria.destroy();
    res.status(200).json({ mensaje: 'Categoría de equipo eliminada correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar la categoría de equipo' });
  }
};
