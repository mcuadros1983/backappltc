import ValeEmpleado from "../../models/sueldoempleado/valeempleado.js";

// Crear vale
export const crearValeEmpleado = async (req, res) => {
  try {
    const vale = await ValeEmpleado.create(req.body);
    res.status(201).json(vale);
  } catch (error) {
    res.status(500).json({ error: "Error al crear el vale", detalle: error.message });
  }
};

// Listar todos los vales
export const listarValesEmpleado = async (req, res) => {
  try {
    const vales = await ValeEmpleado.findAll();
    res.status(200).json(vales);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener los vales" });
  }
};

// Obtener vale por ID
export const obtenerValeEmpleadoPorId = async (req, res) => {
  try {
    const vale = await ValeEmpleado.findByPk(req.params.id);
    if (!vale) return res.status(404).json({ error: "Vale no encontrado" });
    res.status(200).json(vale);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener el vale" });
  }
};

// Actualizar vale
export const actualizarValeEmpleado = async (req, res) => {
  try {
    const vale = await ValeEmpleado.findByPk(req.params.id);
    if (!vale) return res.status(404).json({ error: "Vale no encontrado" });
    await vale.update(req.body);
    res.status(200).json(vale);
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar el vale" });
  }
};

// Eliminar vale
export const eliminarValeEmpleado = async (req, res) => {
  try {
    const vale = await ValeEmpleado.findByPk(req.params.id);
    if (!vale) return res.status(404).json({ error: "Vale no encontrado" });
    await vale.destroy();
    res.status(200).json({ mensaje: "Vale eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar el vale" });
  }
};
