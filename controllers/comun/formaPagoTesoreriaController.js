// controllers/comun/FormaPagoTesoreriaController.js
import FormaPagoTesoreria from "../../models/comun/formapagotesoreria.js";

// Crear nueva forma de pago
export const crearFormaPagoTesoreria = async (req, res) => {
  try {
    const forma = await FormaPagoTesoreria.create(req.body);
    res.status(201).json(forma);
  } catch (error) {
    res.status(500).json({ error: "Error al crear la forma de pago de tesorería" });
  }
};

// Listar todas las formas de pago 
export const listarFormasPagoTesoreria = async (req, res) => {
  try {
    const formas = await FormaPagoTesoreria.findAll();
    console.log("Formas de pago de tesorería encontradas:", formas);
    res.status(200).json(formas);
  } catch (error) {
    console.error("Error en listar Formas Pago de Tesorería:", error);
    res.status(500).json({ error: "Error al listar las formas de pago de tesorería" });
  }
};

// Obtener forma de pago por ID
export const obtenerFormaPagoTesoreriaPorId = async (req, res) => {
  try {
    const forma = await FormaPagoTesoreria.findByPk(req.params.id);
    if (!forma) {
      return res.status(404).json({ error: "Forma de pago de tesorería no encontrada" });
    }
    res.status(200).json(forma);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener la forma de pago de tesorería" });
  }
};

// Actualizar forma de pago por ID
export const actualizarFormaPagoTesoreria = async (req, res) => {
  try {
    const forma = await FormaPagoTesoreria.findByPk(req.params.id);
    if (!forma) {
      return res.status(404).json({ error: "Forma de pago de tesorería no encontrada" });
    }
    await forma.update(req.body);
    res.status(200).json(forma);
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar la forma de pago de tesorería" });
  }
};

// Eliminar forma de pago por ID
export const eliminarFormaPagoTesoreria = async (req, res) => {
  try {
    const forma = await FormaPagoTesoreria.findByPk(req.params.id);
    if (!forma) {
      return res.status(404).json({ error: "Forma de pago de tesorería no encontrada" });
    }
    await forma.destroy();
    res.status(200).json({ mensaje: "Forma de pago  de tesorería eliminada correctamente" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar la forma de pago  de tesorería" });
  }
};
