// controllers/comun/proveedorController.js
import Proveedor from "../../models/comun/proveedor.js";

// Crear nuevo proveedor
export const crearProveedor = async (req, res) => {
  try {
    const proveedor = await Proveedor.create(req.body);
    res.status(201).json(proveedor);
  } catch (error) {
    res.status(500).json({ error: "Error al crear el proveedor" });
  }
};

// Listar todos los proveedores
export const listarProveedores = async (req, res) => {
  try {
    const proveedores = await Proveedor.findAll();
    res.status(200).json(proveedores);
  } catch (error) {
    res.status(500).json({ error: "Error al listar los proveedores" });
  }
};

// Obtener proveedor por ID
export const obtenerProveedorPorId = async (req, res) => {
  try {
    const proveedor = await Proveedor.findByPk(req.params.id);
    if (!proveedor) {
      return res.status(404).json({ error: "Proveedor no encontrado" });
    }
    res.status(200).json(proveedor);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener el proveedor" });
  }
};

// Actualizar proveedor por ID
export const actualizarProveedor = async (req, res) => {
  try {
    const proveedor = await Proveedor.findByPk(req.params.id);
    if (!proveedor) {
      return res.status(404).json({ error: "Proveedor no encontrado" });
    }
    await proveedor.update(req.body);
    res.status(200).json(proveedor);
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar el proveedor" });
  }
};

// Eliminar proveedor por ID
export const eliminarProveedor = async (req, res) => {
  try {
    const proveedor = await Proveedor.findByPk(req.params.id);
    if (!proveedor) {
      return res.status(404).json({ error: "Proveedor no encontrado" });
    }
    await proveedor.destroy();
    res.status(200).json({ mensaje: "Proveedor eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar el proveedor" });
  }
};
