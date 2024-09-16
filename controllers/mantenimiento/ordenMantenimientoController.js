// controllers/ordenMantenimientoController.js
import OrdenMantenimiento from "../../models/mantenimiento/ordenMantenimientoModel.js";

export const crearOrdenMantenimiento = async (req, res) => {
  try {
    const orden = await OrdenMantenimiento.create(req.body);
    res.status(201).json(orden);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear la orden' });
  }
};

export const listarOrdenes = async (req, res) => {
  try {
    const ordenes = await OrdenMantenimiento.findAll();
    res.status(200).json(ordenes);
  } catch (error) {
    res.status(500).json({ error: 'Error al listar las órdenes' });
  }
};

export const obtenerOrdenPorId = async (req, res) => {
  try {
    const orden = await OrdenMantenimiento.findByPk(req.params.id);
    if (!orden) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }
    res.status(200).json(orden);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener la orden' });
  }
};

export const actualizarOrden = async (req, res) => {
  try {
    const orden = await OrdenMantenimiento.findByPk(req.params.id);
    if (!orden) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }
    await orden.update(req.body);
    res.status(200).json(orden);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar la orden' });
  }
};

export const eliminarOrden = async (req, res) => {
  try {
    const orden = await OrdenMantenimiento.findByPk(req.params.id);
    if (!orden) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }
    await orden.destroy();
    res.status(200).json({ mensaje: 'Orden eliminada correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar la orden' });
  }
};
