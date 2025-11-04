// controllers/comun/tipoTarjetaController.js
import TipoTarjeta from "../../models/comun/tipotarjeta.js";

// Crear nuevo tipo de tarjeta
export const crearTipoTarjeta = async (req, res) => {
  try {
    const tipo = await TipoTarjeta.create(req.body);
    res.status(201).json(tipo);
  } catch (error) {
    res.status(500).json({ error: "Error al crear el tipo de tarjeta" });
  }
};

// Listar todos los tipos de tarjeta
export const listarTiposTarjeta = async (req, res) => {
  try {
    const tipos = await TipoTarjeta.findAll();
    res.status(200).json(tipos);
  } catch (error) {
    res.status(500).json({ error: "Error al listar los tipos de tarjeta" });
  }
};

// Obtener tipo de tarjeta por ID
export const obtenerTipoTarjetaPorId = async (req, res) => {
  try {
    const tipo = await TipoTarjeta.findByPk(req.params.id);
    if (!tipo) {
      return res.status(404).json({ error: "Tipo de tarjeta no encontrado" });
    }
    res.status(200).json(tipo);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener el tipo de tarjeta" });
  }
};

// Actualizar tipo de tarjeta por ID
export const actualizarTipoTarjeta = async (req, res) => {
  try {
    const tipo = await TipoTarjeta.findByPk(req.params.id);
    if (!tipo) {
      return res.status(404).json({ error: "Tipo de tarjeta no encontrado" });
    }
    await tipo.update(req.body);
    res.status(200).json(tipo);
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar el tipo de tarjeta" });
  }
};

// Eliminar tipo de tarjeta por ID
export const eliminarTipoTarjeta = async (req, res) => {
  try {
    const tipo = await TipoTarjeta.findByPk(req.params.id);
    if (!tipo) {
      return res.status(404).json({ error: "Tipo de tarjeta no encontrado" });
    }
    await tipo.destroy();
    res.status(200).json({ mensaje: "Tipo de tarjeta eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar el tipo de tarjeta" });
  }
};
