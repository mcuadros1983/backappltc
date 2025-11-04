// controllers/conciliacion/criterioController.js
import ConciliacionCriterio from "../../models/conciliacion/criterio.js";

// Crear un nuevo criterio
export const crearCriterio = async (req, res) => {
  try {
    const criterio = await ConciliacionCriterio.create(req.body);
    res.status(201).json(criterio);
  } catch (error) {
    res.status(500).json({ error: "Error al crear el criterio de conciliación" });
  }
};

// Listar todos los criterios
export const listarCriterios = async (req, res) => {
  try {
    const criterios = await ConciliacionCriterio.findAll();
    res.status(200).json(criterios);
  } catch (error) {
    res.status(500).json({ error: "Error al listar los criterios de conciliación" });
  }
};

// Obtener un criterio por ID
export const obtenerCriterioPorId = async (req, res) => {
  try {
    const criterio = await ConciliacionCriterio.findByPk(req.params.id);
    if (!criterio) {
      return res.status(404).json({ error: "Criterio no encontrado" });
    }
    res.status(200).json(criterio);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener el criterio" });
  }
};

// Actualizar un criterio
export const actualizarCriterio = async (req, res) => {
  try {
    const criterio = await ConciliacionCriterio.findByPk(req.params.id);
    if (!criterio) {
      return res.status(404).json({ error: "Criterio no encontrado" });
    }
    await criterio.update(req.body);
    res.status(200).json(criterio);
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar el criterio" });
  }
};

// Eliminar un criterio
export const eliminarCriterio = async (req, res) => {
  try {
    const criterio = await ConciliacionCriterio.findByPk(req.params.id);
    if (!criterio) {
      return res.status(404).json({ error: "Criterio no encontrado" });
    }
    await criterio.destroy();
    res.status(200).json({ mensaje: "Criterio eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar el criterio" });
  }
};
