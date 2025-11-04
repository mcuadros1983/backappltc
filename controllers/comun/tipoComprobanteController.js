// controllers/comun/tipoComprobanteController.js
import TipoComprobante from "../../models/comun/tipocomprobante.js";

// Crear nuevo tipo de comprobante
export const crearTipoComprobante = async (req, res) => {
  try {
    const tipo = await TipoComprobante.create(req.body);
    res.status(201).json(tipo);
  } catch (error) {
    res.status(500).json({ error: "Error al crear el tipo de comprobante" });
  }
};

// Listar todos los tipos de comprobante
export const listarTiposComprobante = async (req, res) => {
  try {
    const tipos = await TipoComprobante.findAll();
    res.status(200).json(tipos);
  } catch (error) {
    res.status(500).json({ error: "Error al listar los tipos de comprobante" });
  }
};

// Obtener tipo de comprobante por ID
export const obtenerTipoComprobantePorId = async (req, res) => {
  try {
    const tipo = await TipoComprobante.findByPk(req.params.id);
    if (!tipo) {
      return res.status(404).json({ error: "Tipo de comprobante no encontrado" });
    }
    res.status(200).json(tipo);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener el tipo de comprobante" });
  }
};

// Actualizar tipo de comprobante por ID
export const actualizarTipoComprobante = async (req, res) => {
  try {
    const tipo = await TipoComprobante.findByPk(req.params.id);
    if (!tipo) {
      return res.status(404).json({ error: "Tipo de comprobante no encontrado" });
    }
    await tipo.update(req.body);
    res.status(200).json(tipo);
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar el tipo de comprobante" });
  }
};

// Eliminar tipo de comprobante por ID
export const eliminarTipoComprobante = async (req, res) => {
  try {
    const tipo = await TipoComprobante.findByPk(req.params.id);
    if (!tipo) {
      return res.status(404).json({ error: "Tipo de comprobante no encontrado" });
    }
    await tipo.destroy();
    res.status(200).json({ mensaje: "Tipo de comprobante eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar el tipo de comprobante" });
  }
};
