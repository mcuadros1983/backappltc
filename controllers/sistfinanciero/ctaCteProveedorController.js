import CtaCteProveedor from "../../models/sistfinanciero/ctacteproveedor.js";

// Crear una nueva cuenta corriente de proveedor
export const crearCtaCteProveedor = async (req, res) => {
  try {
    const nuevo = await CtaCteProveedor.create(req.body);
    res.status(201).json(nuevo);
  } catch (error) {
    res.status(500).json({ error: "Error al crear la cuenta corriente", detalle: error.message });
  }
};

// Listar todas las cuentas corrientes de proveedores
export const listarCtaCteProveedores = async (req, res) => {
  try {
    const lista = await CtaCteProveedor.findAll();
    res.status(200).json(lista);
  } catch (error) {
    res.status(500).json({ error: "Error al listar cuentas corrientes" });
  }
};

// Obtener cuenta por ID
export const obtenerCtaCteProveedorPorId = async (req, res) => {
  try {
    const item = await CtaCteProveedor.findByPk(req.params.id);
    if (!item) return res.status(404).json({ error: "Cuenta corriente no encontrada" });
    res.status(200).json(item);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener la cuenta corriente" });
  }
};

// Actualizar cuenta corriente
export const actualizarCtaCteProveedor = async (req, res) => {
  try {
    const item = await CtaCteProveedor.findByPk(req.params.id);
    if (!item) return res.status(404).json({ error: "Cuenta corriente no encontrada" });
    await item.update(req.body);
    res.status(200).json(item);
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar la cuenta corriente" });
  }
};

// Eliminar cuenta corriente
export const eliminarCtaCteProveedor = async (req, res) => {
  try {
    const item = await CtaCteProveedor.findByPk(req.params.id);
    if (!item) return res.status(404).json({ error: "Cuenta corriente no encontrada" });
    await item.destroy();
    res.status(200).json({ mensaje: "Cuenta corriente eliminada correctamente" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar la cuenta corriente" });
  }
};
