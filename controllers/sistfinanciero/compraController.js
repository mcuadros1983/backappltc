import Compra from "../../models/sistfinanciero/compra.js";

// Crear una nueva compra
export const crearCompra = async (req, res) => {
  try {
    const nueva = await Compra.create(req.body);
    res.status(201).json(nueva);
  } catch (error) {
    res.status(500).json({ error: "Error al crear la compra", detalle: error.message });
  }
};

// Listar todas las compras
export const listarCompras = async (req, res) => {
  try {
    const lista = await Compra.findAll();
    res.status(200).json(lista);
  } catch (error) {
    res.status(500).json({ error: "Error al listar compras" });
  }
};

// Obtener compra por ID
export const obtenerCompraPorId = async (req, res) => {
  try {
    const item = await Compra.findByPk(req.params.id);
    if (!item) return res.status(404).json({ error: "Compra no encontrada" });
    res.status(200).json(item);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener la compra" });
  }
};

// Actualizar compra
export const actualizarCompra = async (req, res) => {
  try {
    const item = await Compra.findByPk(req.params.id);
    if (!item) return res.status(404).json({ error: "Compra no encontrada" });
    await item.update(req.body);
    res.status(200).json(item);
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar la compra" });
  }
};

// Eliminar compra
export const eliminarCompra = async (req, res) => {
  try {
    const item = await Compra.findByPk(req.params.id);
    if (!item) return res.status(404).json({ error: "Compra no encontrada" });
    await item.destroy();
    res.status(200).json({ mensaje: "Compra eliminada correctamente" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar la compra" });
  }
};
