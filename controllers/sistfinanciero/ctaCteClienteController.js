import CtaCteCliente from "../../models/sistfinanciero/ctactecliente.js";

// Crear una nueva cuenta corriente de cliente
export const crearCtaCteCliente = async (req, res) => {
  try {
    const nueva = await CtaCteCliente.create(req.body);
    res.status(201).json(nueva);
  } catch (error) {
    res.status(500).json({ error: "Error al crear la cuenta corriente", detalle: error.message });
  }
};

// Listar todas las cuentas corrientes de clientes
export const listarCtaCteClientes = async (req, res) => {
  try {
    const lista = await CtaCteCliente.findAll();
    res.status(200).json(lista);
  } catch (error) {
    res.status(500).json({ error: "Error al listar cuentas corrientes" });
  }
};

// Obtener por ID
export const obtenerCtaCteClientePorId = async (req, res) => {
  try {
    const item = await CtaCteCliente.findByPk(req.params.id);
    if (!item) return res.status(404).json({ error: "Cuenta corriente no encontrada" });
    res.status(200).json(item);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener la cuenta corriente" });
  }
};

// Actualizar
export const actualizarCtaCteCliente = async (req, res) => {
  try {
    const item = await CtaCteCliente.findByPk(req.params.id);
    if (!item) return res.status(404).json({ error: "Cuenta corriente no encontrada" });
    await item.update(req.body);
    res.status(200).json(item);
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar la cuenta corriente" });
  }
};

// Eliminar
export const eliminarCtaCteCliente = async (req, res) => {
  try {
    const item = await CtaCteCliente.findByPk(req.params.id);
    if (!item) return res.status(404).json({ error: "Cuenta corriente no encontrada" });
    await item.destroy();
    res.status(200).json({ mensaje: "Cuenta corriente eliminada correctamente" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar la cuenta corriente" });
  }
};
