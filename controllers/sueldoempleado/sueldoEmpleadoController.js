import SueldoEmpleado from "../../models/sueldoempleado/sueldoempleado.js";

// Crear sueldo
export const crearSueldoEmpleado = async (req, res) => {
  try {
    const sueldo = await SueldoEmpleado.create(req.body);
    res.status(201).json(sueldo);
  } catch (error) {
    res.status(500).json({ error: "Error al crear el sueldo", detalle: error.message });
  }
};

// Listar todos los sueldos
export const listarSueldosEmpleado = async (req, res) => {
  try {
    const sueldos = await SueldoEmpleado.findAll();
    res.status(200).json(sueldos);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener los sueldos" });
  }
};

// Obtener por ID
export const obtenerSueldoEmpleadoPorId = async (req, res) => {
  try {
    const sueldo = await SueldoEmpleado.findByPk(req.params.id);
    if (!sueldo) return res.status(404).json({ error: "Sueldo no encontrado" });
    res.status(200).json(sueldo);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener el sueldo" });
  }
};

// Actualizar sueldo
export const actualizarSueldoEmpleado = async (req, res) => {
  try {
    const sueldo = await SueldoEmpleado.findByPk(req.params.id);
    if (!sueldo) return res.status(404).json({ error: "Sueldo no encontrado" });
    await sueldo.update(req.body);
    res.status(200).json(sueldo);
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar el sueldo" });
  }
};

// Eliminar sueldo
export const eliminarSueldoEmpleado = async (req, res) => {
  try {
    const sueldo = await SueldoEmpleado.findByPk(req.params.id);
    if (!sueldo) return res.status(404).json({ error: "Sueldo no encontrado" });
    await sueldo.destroy();
    res.status(200).json({ mensaje: "Sueldo eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar el sueldo" });
  }
};
