import PagoProveedor from "../../models/sistfinanciero/pagoproveedor.js";

// Crear pago
export const crearPagoProveedor = async (req, res) => {
  try {
    const nuevoPago = await PagoProveedor.create(req.body);
    res.status(201).json(nuevoPago);
  } catch (error) {
    res.status(500).json({ error: "Error al crear el pago", detalle: error.message });
  }
};

// Listar todos los pagos
export const listarPagosProveedor = async (req, res) => {
  try {
    const pagos = await PagoProveedor.findAll();
    res.status(200).json(pagos);
  } catch (error) {
    res.status(500).json({ error: "Error al listar los pagos" });
  }
};

// Obtener por ID
export const obtenerPagoProveedorPorId = async (req, res) => {
  try {
    const pago = await PagoProveedor.findByPk(req.params.id);
    if (!pago) return res.status(404).json({ error: "Pago no encontrado" });
    res.status(200).json(pago);
  } catch (error) {
    res.status(500).json({ error: "Error al buscar el pago" });
  }
};

// Actualizar pago
export const actualizarPagoProveedor = async (req, res) => {
  try {
    const pago = await PagoProveedor.findByPk(req.params.id);
    if (!pago) return res.status(404).json({ error: "Pago no encontrado" });
    await pago.update(req.body);
    res.status(200).json(pago);
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar el pago" });
  }
};

// Eliminar pago
export const eliminarPagoProveedor = async (req, res) => {
  try {
    const pago = await PagoProveedor.findByPk(req.params.id);
    if (!pago) return res.status(404).json({ error: "Pago no encontrado" });
    await pago.destroy();
    res.status(200).json({ mensaje: "Pago eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar el pago" });
  }
};
