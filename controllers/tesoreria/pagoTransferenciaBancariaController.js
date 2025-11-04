import PagoTransferenciaBancaria from "../../models/tesoreria/pagotransferenciabancaria.js";

// Crear pago por transferencia
export const crearPagoTransferenciaBancaria = async (req, res) => {
  try {
    const pago = await PagoTransferenciaBancaria.create(req.body);
    res.status(201).json(pago);
  } catch (error) {
    res.status(500).json({
      error: "Error al crear el pago por transferencia bancaria",
      detalle: error.message,
    });
  }
};

// Listar todos
export const listarPagosTransferenciaBancaria = async (req, res) => {
  try {
    const pagos = await PagoTransferenciaBancaria.findAll();
    res.status(200).json(pagos);
  } catch (error) {
    res.status(500).json({
      error: "Error al obtener los pagos por transferencia bancaria",
      detalle: error.message,
    });
  }
};

// Obtener por ID
export const obtenerPagoTransferenciaBancariaPorId = async (req, res) => {
  try {
    const pago = await PagoTransferenciaBancaria.findByPk(req.params.id);
    if (!pago) {
      return res.status(404).json({ error: "Pago por transferencia no encontrado" });
    }
    res.status(200).json(pago);
  } catch (error) {
    res.status(500).json({
      error: "Error al obtener el pago por transferencia bancaria",
      detalle: error.message,
    });
  }
};

// Actualizar
export const actualizarPagoTransferenciaBancaria = async (req, res) => {
  try {
    const pago = await PagoTransferenciaBancaria.findByPk(req.params.id);
    if (!pago) {
      return res.status(404).json({ error: "Pago por transferencia no encontrado" });
    }
    await pago.update(req.body);
    res.status(200).json(pago);
  } catch (error) {
    res.status(500).json({
      error: "Error al actualizar el pago por transferencia bancaria",
      detalle: error.message,
    });
  }
};

// Eliminar
export const eliminarPagoTransferenciaBancaria = async (req, res) => {
  try {
    const pago = await PagoTransferenciaBancaria.findByPk(req.params.id);
    if (!pago) {
      return res.status(404).json({ error: "Pago por transferencia no encontrado" });
    }
    await pago.destroy();
    res.status(200).json({ mensaje: "Pago por transferencia eliminado correctamente" });
  } catch (error) {
    res.status(500).json({
      error: "Error al eliminar el pago por transferencia bancaria",
      detalle: error.message,
    });
  }
};
