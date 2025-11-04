import DescuentoSueldo from "../../models/sueldoempleado/descuentosueldo.js";

// Crear descuento
export const crearDescuentoSueldo = async (req, res) => {
  try {
    const descuento = await DescuentoSueldo.create(req.body);
    res.status(201).json(descuento);
  } catch (error) {
    res.status(500).json({ error: "Error al crear el descuento", detalle: error.message });
  }
};

// Listar todos los descuentos
export const listarDescuentosSueldo = async (req, res) => {
  try {
    const descuentos = await DescuentoSueldo.findAll();
    res.status(200).json(descuentos);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener los descuentos" });
  }
};

// Obtener por ID
export const obtenerDescuentoSueldoPorId = async (req, res) => {
  try {
    const descuento = await DescuentoSueldo.findByPk(req.params.id);
    if (!descuento) return res.status(404).json({ error: "Descuento no encontrado" });
    res.status(200).json(descuento);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener el descuento" });
  }
};

// Actualizar descuento
export const actualizarDescuentoSueldo = async (req, res) => {
  try {
    const descuento = await DescuentoSueldo.findByPk(req.params.id);
    if (!descuento) return res.status(404).json({ error: "Descuento no encontrado" });
    await descuento.update(req.body);
    res.status(200).json(descuento);
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar el descuento" });
  }
};

// Eliminar descuento
export const eliminarDescuentoSueldo = async (req, res) => {
  try {
    const descuento = await DescuentoSueldo.findByPk(req.params.id);
    if (!descuento) return res.status(404).json({ error: "Descuento no encontrado" });
    await descuento.destroy();
    res.status(200).json({ mensaje: "Descuento eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar el descuento" });
  }
};
