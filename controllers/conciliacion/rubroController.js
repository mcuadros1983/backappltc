// controllers/conciliacion/rubroController.js
import ConciliacionRubro from "../../models/conciliacion/rubro.js";

// Crear nuevo rubro
export const crearRubro = async (req, res) => {
  try {
    const rubro = await ConciliacionRubro.create(req.body);
    res.status(201).json(rubro);
  } catch (error) {
    res.status(500).json({ error: "Error al crear el rubro" });
  }
};

// Listar todos los rubros
export const listarRubros = async (req, res) => {
  try {
    const rubros = await ConciliacionRubro.findAll();
    res.status(200).json(rubros);
  } catch (error) {
    res.status(500).json({ error: "Error al listar los rubros" });
  }
};

// Obtener un rubro por ID
export const obtenerRubroPorId = async (req, res) => {
  try {
    const rubro = await ConciliacionRubro.findByPk(req.params.id);
    if (!rubro) {
      return res.status(404).json({ error: "Rubro no encontrado" });
    }
    res.status(200).json(rubro);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener el rubro" });
  }
};

// Actualizar un rubro por ID
export const actualizarRubro = async (req, res) => {
  try {
    const rubro = await ConciliacionRubro.findByPk(req.params.id);
    if (!rubro) {
      return res.status(404).json({ error: "Rubro no encontrado" });
    }
    await rubro.update(req.body);
    res.status(200).json(rubro);
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar el rubro" });
  }
};

// Eliminar un rubro por ID
export const eliminarRubro = async (req, res) => {
  try {
    const rubro = await ConciliacionRubro.findByPk(req.params.id);
    if (!rubro) {
      return res.status(404).json({ error: "Rubro no encontrado" });
    }
    await rubro.destroy();
    res.status(200).json({ mensaje: "Rubro eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar el rubro" });
  }
};
