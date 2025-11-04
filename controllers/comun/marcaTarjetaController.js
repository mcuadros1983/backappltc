// controllers/comun/marcaTarjetaController.js
import MarcaTarjeta from "../../models/comun/marcatarjeta.js";

// Crear nueva marca de tarjeta
export const crearMarcaTarjeta = async (req, res) => {
  try {
    const marca = await MarcaTarjeta.create(req.body);
    res.status(201).json(marca);
  } catch (error) {
    res.status(500).json({ error: "Error al crear la marca de tarjeta" });
  }
};

// Listar todas las marcas de tarjeta
export const listarMarcasTarjeta = async (req, res) => {
  try {
    const marcas = await MarcaTarjeta.findAll();
    res.status(200).json(marcas);
  } catch (error) {
    res.status(500).json({ error: "Error al listar las marcas de tarjeta" });
  }
};

// Obtener marca por ID
export const obtenerMarcaTarjetaPorId = async (req, res) => {
  try {
    const marca = await MarcaTarjeta.findByPk(req.params.id);
    if (!marca) {
      return res.status(404).json({ error: "Marca de tarjeta no encontrada" });
    }
    res.status(200).json(marca);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener la marca de tarjeta" });
  }
};

// Actualizar marca por ID
export const actualizarMarcaTarjeta = async (req, res) => {
  try {
    const marca = await MarcaTarjeta.findByPk(req.params.id);
    if (!marca) {
      return res.status(404).json({ error: "Marca de tarjeta no encontrada" });
    }
    await marca.update(req.body);
    res.status(200).json(marca);
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar la marca de tarjeta" });
  }
};

// Eliminar marca por ID
export const eliminarMarcaTarjeta = async (req, res) => {
  try {
    const marca = await MarcaTarjeta.findByPk(req.params.id);
    if (!marca) {
      return res.status(404).json({ error: "Marca de tarjeta no encontrada" });
    }
    await marca.destroy();
    res.status(200).json({ mensaje: "Marca de tarjeta eliminada correctamente" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar la marca de tarjeta" });
  }
};
