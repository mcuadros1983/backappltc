import DeudaCliente from "../../models/sistfinanciero/deudacliente.js";

// Crear una nueva deuda
export const crearDeudaCliente = async (req, res) => {
  try {
    const nueva = await DeudaCliente.create(req.body);
    res.status(201).json(nueva);
  } catch (error) {
    res.status(500).json({ error: "Error al crear deuda", detalle: error.message });
  }
};

// Listar todas las deudas
export const listarDeudasClientes = async (req, res) => {
  try {
    const deudas = await DeudaCliente.findAll();
    res.status(200).json(deudas);
  } catch (error) {
    res.status(500).json({ error: "Error al listar deudas" });
  }
};

// Obtener una deuda por ID
export const obtenerDeudaClientePorId = async (req, res) => {
  try {
    const deuda = await DeudaCliente.findByPk(req.params.id);
    if (!deuda) return res.status(404).json({ error: "Deuda no encontrada" });
    res.status(200).json(deuda);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener deuda" });
  }
};

// Actualizar deuda
export const actualizarDeudaCliente = async (req, res) => {
  try {
    const deuda = await DeudaCliente.findByPk(req.params.id);
    if (!deuda) return res.status(404).json({ error: "Deuda no encontrada" });
    await deuda.update(req.body);
    res.status(200).json(deuda);
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar deuda" });
  }
};

// Eliminar deuda
export const eliminarDeudaCliente = async (req, res) => {
  try {
    const deuda = await DeudaCliente.findByPk(req.params.id);
    if (!deuda) return res.status(404).json({ error: "Deuda no encontrada" });
    await deuda.destroy();
    res.status(200).json({ mensaje: "Deuda eliminada correctamente" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar deuda" });
  }
};
