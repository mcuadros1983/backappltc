// controllers/mantenimientoPreventivoController.js
import MantenimientoPreventivo from "../../models/mantenimiento/mantenimientoPreventivoModel.js";
import Equipo from "../../models/mantenimiento/equipoModel.js"; // Asegúrate de importar el modelo de Equipo

export const crearMantenimientoPreventivo = async (req, res) => {
  try {
    const mantenimientoPreventivo = await MantenimientoPreventivo.create(req.body);
    res.status(201).json(mantenimientoPreventivo);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear el mantenimiento preventivo' });
  }
};

// export const listarMantenimientosPreventivos = async (req, res) => {
//   try {
//     const mantenimientosPreventivos = await MantenimientoPreventivo.findAll();
//     res.status(200).json(mantenimientosPreventivos);
//   } catch (error) {
//     res.status(500).json({ error: 'Error al listar los mantenimientos preventivos' });
//   }
// };

export const listarMantenimientosPreventivos = async (req, res) => {
  try {
    const mantenimientosPreventivos = await MantenimientoPreventivo.findAll({
      include: [
        { model: Equipo, attributes: ['nombre'] } // Incluye el nombre del equipo en la respuesta
      ]
    });
    res.status(200).json(mantenimientosPreventivos);
  } catch (error) {
    res.status(500).json({ error: 'Error al listar los mantenimientos preventivos' });
  }
};

export const obtenerMantenimientoPreventivoPorId = async (req, res) => {
  try {
    const mantenimientoPreventivo = await MantenimientoPreventivo.findByPk(req.params.id);
    if (!mantenimientoPreventivo) {
      return res.status(404).json({ error: 'Mantenimiento preventivo no encontrado' });
    }
    res.status(200).json(mantenimientoPreventivo);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener el mantenimiento preventivo' });
  }
};

export const actualizarMantenimientoPreventivo = async (req, res) => {
  try {
    const mantenimientoPreventivo = await MantenimientoPreventivo.findByPk(req.params.id);
    if (!mantenimientoPreventivo) {
      return res.status(404).json({ error: 'Mantenimiento preventivo no encontrado' });
    }
    await mantenimientoPreventivo.update(req.body);
    res.status(200).json(mantenimientoPreventivo);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar el mantenimiento preventivo' });
  }
};

export const eliminarMantenimientoPreventivo = async (req, res) => {
  try {
    const mantenimientoPreventivo = await MantenimientoPreventivo.findByPk(req.params.id);
    if (!mantenimientoPreventivo) {
      return res.status(404).json({ error: 'Mantenimiento preventivo no encontrado' });
    }
    await mantenimientoPreventivo.destroy();
    res.status(200).json({ mensaje: 'Mantenimiento preventivo eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar el mantenimiento preventivo' });
  }
};
