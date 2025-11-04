// controllers/comun/ptoVentaController.js
import PtoVenta from "../../models/comun/ptoventa.js";

// Crear nuevo punto de venta
export const crearPtoVenta = async (req, res) => {
  try {
    const punto = await PtoVenta.create(req.body);
    res.status(201).json(punto);
  } catch (error) {
    res.status(500).json({ error: "Error al crear el punto de venta" });
  }
};

// Listar todos los puntos de venta
export const listarPtosVenta = async (req, res) => {
  try {
    const puntos = await PtoVenta.findAll();
    res.status(200).json(puntos);
  } catch (error) {
    res.status(500).json({ error: "Error al listar los puntos de venta" });
  }
};

// Obtener punto de venta por ID
export const obtenerPtoVentaPorId = async (req, res) => {
  try {
    const punto = await PtoVenta.findByPk(req.params.id);
    if (!punto) {
      return res.status(404).json({ error: "Punto de venta no encontrado" });
    }
    res.status(200).json(punto);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener el punto de venta" });
  }
};

// Actualizar punto de venta por ID
export const actualizarPtoVenta = async (req, res) => {
  try {
    const punto = await PtoVenta.findByPk(req.params.id);
    if (!punto) {
      return res.status(404).json({ error: "Punto de venta no encontrado" });
    }
    await punto.update(req.body);
    res.status(200).json(punto);
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar el punto de venta" });
  }
};

// Eliminar punto de venta por ID
export const eliminarPtoVenta = async (req, res) => {
  try {
    const punto = await PtoVenta.findByPk(req.params.id);
    if (!punto) {
      return res.status(404).json({ error: "Punto de venta no encontrado" });
    }
    await punto.destroy();
    res.status(200).json({ mensaje: "Punto de venta eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar el punto de venta" });
  }
};
