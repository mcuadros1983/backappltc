// controllers/comun/imputacionContableController.js
import ImputacionContable from "../../models/comun/imputacioncontable.js";

// Crear nueva imputación contable
export const crearImputacionContable = async (req, res) => {
  try {
    const imputacion = await ImputacionContable.create(req.body);
    res.status(201).json(imputacion);
  } catch (error) {
    res.status(500).json({ error: "Error al crear la imputación contable" });
  }
};

// Listar todas las imputaciones contables
export const listarImputacionesContables = async (req, res) => {
  try {
    const imputaciones = await ImputacionContable.findAll();
    res.status(200).json(imputaciones);
  } catch (error) {
    res.status(500).json({ error: "Error al listar las imputaciones contables" });
  }
};

// Obtener imputación contable por ID
export const obtenerImputacionContablePorId = async (req, res) => {
  try {
    const imputacion = await ImputacionContable.findByPk(req.params.id);
    if (!imputacion) {
      return res.status(404).json({ error: "Imputación contable no encontrada" });
    }
    res.status(200).json(imputacion);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener la imputación contable" });
  }
};

// Actualizar imputación contable por ID
export const actualizarImputacionContable = async (req, res) => {
  try {
    const imputacion = await ImputacionContable.findByPk(req.params.id);
    if (!imputacion) {
      return res.status(404).json({ error: "Imputación contable no encontrada" });
    }
    await imputacion.update(req.body);
    res.status(200).json(imputacion);
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar la imputación contable" });
  }
};

// Eliminar imputación contable por ID
export const eliminarImputacionContable = async (req, res) => {
  try {
    const imputacion = await ImputacionContable.findByPk(req.params.id);
    if (!imputacion) {
      return res.status(404).json({ error: "Imputación contable no encontrada" });
    }
    await imputacion.destroy();
    res.status(200).json({ mensaje: "Imputación contable eliminada correctamente" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar la imputación contable" });
  }
};
