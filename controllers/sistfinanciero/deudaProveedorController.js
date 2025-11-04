import DeudaProveedor from "../../models/sistfinanciero/deudaproveedor.js";

// Crear nueva deuda
export const crearDeudaProveedor = async (req, res) => {
  try {
    const nueva = await DeudaProveedor.create(req.body);
    res.status(201).json(nueva);
  } catch (error) {
    res.status(500).json({ error: "Error al crear deuda del proveedor", detalle: error.message });
  }
};

// Listar todas las deudas
export const listarDeudasProveedor = async (req, res) => {
  try {
    const deudas = await DeudaProveedor.findAll();
    res.status(200).json(deudas);
  } catch (error) {
    res.status(500).json({ error: "Error al listar deudas" });
  }
};

// Obtener una deuda por ID
export const obtenerDeudaProveedorPorId = async (req, res) => {
  try {
    const deuda = await DeudaProveedor.findByPk(req.params.id);
    if (!deuda) return res.status(404).json({ error: "Deuda no encontrada" });
    res.status(200).json(deuda);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener deuda" });
  }
};

// Actualizar deuda
export const actualizarDeudaProveedor = async (req, res) => {
  try {
    const deuda = await DeudaProveedor.findByPk(req.params.id);
    if (!deuda) return res.status(404).json({ error: "Deuda no encontrada" });
    await deuda.update(req.body);
    res.status(200).json(deuda);
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar deuda" });
  }
};

// Eliminar deuda
export const eliminarDeudaProveedor = async (req, res) => {
  try {
    const deuda = await DeudaProveedor.findByPk(req.params.id);
    if (!deuda) return res.status(404).json({ error: "Deuda no encontrada" });
    await deuda.destroy();
    res.status(200).json({ mensaje: "Deuda eliminada correctamente" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar deuda" });
  }
};
