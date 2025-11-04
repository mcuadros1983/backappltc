import EstadoDeudaCliente from "../../models/sistfinanciero/estadodeudacliente.js";

// Crear nuevo cambio de estado
export const crearEstadoDeudaCliente = async (req, res) => {
  try {
    const nuevo = await EstadoDeudaCliente.create(req.body);
    res.status(201).json(nuevo);
  } catch (error) {
    res.status(500).json({ error: "Error al crear el cambio de estado", detalle: error.message });
  }
};

// Listar todos los cambios de estado
export const listarEstadosDeudaCliente = async (req, res) => {
  try {
    const estados = await EstadoDeudaCliente.findAll();
    res.status(200).json(estados);
  } catch (error) {
    res.status(500).json({ error: "Error al listar estados" });
  }
};

// Obtener por ID
export const obtenerEstadoDeudaClientePorId = async (req, res) => {
  try {
    const estado = await EstadoDeudaCliente.findByPk(req.params.id);
    if (!estado) return res.status(404).json({ error: "Estado no encontrado" });
    res.status(200).json(estado);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener estado" });
  }
};

// Actualizar
export const actualizarEstadoDeudaCliente = async (req, res) => {
  try {
    const estado = await EstadoDeudaCliente.findByPk(req.params.id);
    if (!estado) return res.status(404).json({ error: "Estado no encontrado" });
    await estado.update(req.body);
    res.status(200).json(estado);
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar estado" });
  }
};

// Eliminar
export const eliminarEstadoDeudaCliente = async (req, res) => {
  try {
    const estado = await EstadoDeudaCliente.findByPk(req.params.id);
    if (!estado) return res.status(404).json({ error: "Estado no encontrado" });
    await estado.destroy();
    res.status(200).json({ mensaje: "Estado eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar estado" });
  }
};
