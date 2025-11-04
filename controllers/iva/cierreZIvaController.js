import CierreZIva from "../../models/iva/cierreziva.js";

// Crear nuevo cierre Z IVA
export const crearCierreZIva = async (req, res) => {
  try {
    const nuevoCierre = await CierreZIva.create(req.body);
    res.status(201).json(nuevoCierre);
  } catch (error) {
    res.status(500).json({ error: "Error al crear el cierre Z IVA" });
  }
};

// Listar todos los cierres
export const listarCierresZIva = async (req, res) => {
  try {
    const cierres = await CierreZIva.findAll();
    res.status(200).json(cierres);
  } catch (error) {
    res.status(500).json({ error: "Error al listar cierres Z IVA" });
  }
};

// Obtener un cierre por ID
export const obtenerCierreZIvaPorId = async (req, res) => {
  try {
    const cierre = await CierreZIva.findByPk(req.params.id);
    if (!cierre) {
      return res.status(404).json({ error: "Cierre Z IVA no encontrado" });
    }
    res.status(200).json(cierre);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener el cierre Z IVA" });
  }
};

// Actualizar un cierre
export const actualizarCierreZIva = async (req, res) => {
  try {
    const cierre = await CierreZIva.findByPk(req.params.id);
    if (!cierre) {
      return res.status(404).json({ error: "Cierre Z IVA no encontrado" });
    }
    await cierre.update(req.body);
    res.status(200).json(cierre);
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar el cierre Z IVA" });
  }
};

// Eliminar un cierre
export const eliminarCierreZIva = async (req, res) => {
  try {
    const cierre = await CierreZIva.findByPk(req.params.id);
    if (!cierre) {
      return res.status(404).json({ error: "Cierre Z IVA no encontrado" });
    }
    await cierre.destroy();
    res.status(200).json({ mensaje: "Cierre Z IVA eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar el cierre Z IVA" });
  }
};
