import PagoCliente from "../../models/sistfinanciero/pagocliente.js";

// Crear nuevo pago
export const crearPagoCliente = async (req, res) => {
  try {
    const nuevoPago = await PagoCliente.create(req.body);
    res.status(201).json(nuevoPago);
  } catch (error) {
    res.status(500).json({ error: "Error al registrar el pago", detalle: error.message });
  }
};

// Obtener todos los pagos
export const listarPagosCliente = async (req, res) => {
  try {
    const pagos = await PagoCliente.findAll();
    res.status(200).json(pagos);
  } catch (error) {
    res.status(500).json({ error: "Error al listar los pagos" });
  }
};

// Obtener un pago por ID
export const obtenerPagoClientePorId = async (req, res) => {
  try {
    const pago = await PagoCliente.findByPk(req.params.id);
    if (!pago) return res.status(404).json({ error: "Pago no encontrado" });
    res.status(200).json(pago);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener el pago" });
  }
};

// Actualizar un pago
export const actualizarPagoCliente = async (req, res) => {
  try {
    const pago = await PagoCliente.findByPk(req.params.id);
    if (!pago) return res.status(404).json({ error: "Pago no encontrado" });
    await pago.update(req.body);
    res.status(200).json(pago);
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar el pago" });
  }
};

// Eliminar un pago
export const eliminarPagoCliente = async (req, res) => {
  try {
    const pago = await PagoCliente.findByPk(req.params.id);
    if (!pago) return res.status(404).json({ error: "Pago no encontrado" });
    await pago.destroy();
    res.status(200).json({ mensaje: "Pago eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar el pago" });
  }
};
