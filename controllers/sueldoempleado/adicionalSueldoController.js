import AdicionalSueldo from "../../models/sueldoempleado/adicionalsueldo.js";

// Crear adicional
export const crearAdicionalSueldo = async (req, res) => {
  try {
    const adicional = await AdicionalSueldo.create(req.body);
    res.status(201).json(adicional);
  } catch (error) {
    res.status(500).json({ error: "Error al crear el adicional", detalle: error.message });
  }
};

// Listar todos los adicionales
export const listarAdicionalesSueldo = async (req, res) => {
  try {
    const adicionales = await AdicionalSueldo.findAll();
    res.status(200).json(adicionales);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener los adicionales" });
  }
};

// Obtener por ID
export const obtenerAdicionalSueldoPorId = async (req, res) => {
  try {
    const adicional = await AdicionalSueldo.findByPk(req.params.id);
    if (!adicional) return res.status(404).json({ error: "Adicional no encontrado" });
    res.status(200).json(adicional);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener el adicional" });
  }
};

// Actualizar adicional
export const actualizarAdicionalSueldo = async (req, res) => {
  try {
    const adicional = await AdicionalSueldo.findByPk(req.params.id);
    if (!adicional) return res.status(404).json({ error: "Adicional no encontrado" });
    await adicional.update(req.body);
    res.status(200).json(adicional);
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar el adicional" });
  }
};

// Eliminar adicional
export const eliminarAdicionalSueldo = async (req, res) => {
  try {
    const adicional = await AdicionalSueldo.findByPk(req.params.id);
    if (!adicional) return res.status(404).json({ error: "Adicional no encontrado" });
    await adicional.destroy();
    res.status(200).json({ mensaje: "Adicional eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar el adicional" });
  }
};
