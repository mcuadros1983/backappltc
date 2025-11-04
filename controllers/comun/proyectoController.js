// controllers/comun/proyectoController.js
import Proyecto from "../../models/comun/proyecto.js";

// Crear nuevo proyecto
export const crearProyecto = async (req, res) => {
  try {
    const proyecto = await Proyecto.create(req.body);
    res.status(201).json(proyecto);
  } catch (error) {
    res.status(500).json({ error: "Error al crear el proyecto" });
  }
};

// Listar todos los proyectos
export const listarProyectos = async (req, res) => {
  try {
    const proyectos = await Proyecto.findAll();
    res.status(200).json(proyectos);
  } catch (error) {
    res.status(500).json({ error: "Error al listar los proyectos" });
  }
};

// Obtener proyecto por ID
export const obtenerProyectoPorId = async (req, res) => {
  try {
    const proyecto = await Proyecto.findByPk(req.params.id);
    if (!proyecto) {
      return res.status(404).json({ error: "Proyecto no encontrado" });
    }
    res.status(200).json(proyecto);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener el proyecto" });
  }
};

// Actualizar proyecto por ID
export const actualizarProyecto = async (req, res) => {
  try {
    const proyecto = await Proyecto.findByPk(req.params.id);
    if (!proyecto) {
      return res.status(404).json({ error: "Proyecto no encontrado" });
    }
    await proyecto.update(req.body);
    res.status(200).json(proyecto);
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar el proyecto" });
  }
};

// Eliminar proyecto por ID
export const eliminarProyecto = async (req, res) => {
  try {
    const proyecto = await Proyecto.findByPk(req.params.id);
    if (!proyecto) {
      return res.status(404).json({ error: "Proyecto no encontrado" });
    }
    await proyecto.destroy();
    res.status(200).json({ mensaje: "Proyecto eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar el proyecto" });
  }
};
