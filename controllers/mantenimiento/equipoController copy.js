// controllers/equipoController.js
// import Equipo  from "../../models/mantenimiento/equipoModel.js";
import Equipo from "../../models/mantenimiento/equipoModel.js";
import Mantenimiento from "../../models/mantenimiento/mantenimientoModel.js";
import OrdenMantenimiento from "../../models/mantenimiento/ordenMantenimientoModel.js";
import MantenimientoPreventivo from "../../models/mantenimiento/mantenimientoPreventivoModel.js";


export const crearEquipo = async (req, res) => {
  try {
    const equipo = await Equipo.create(req.body);
    res.status(201).json(equipo);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear el equipo' });
  }
};

export const listarEquipos = async (req, res) => {
  try {
    const equipos = await Equipo.findAll();
    res.status(200).json(equipos);
  } catch (error) {
    res.status(500).json({ error: 'Error al listar los equipos' });
  }
};

export const obtenerEquipoPorId = async (req, res) => {
  try {
    const equipo = await Equipo.findByPk(req.params.id);
    if (!equipo) {
      return res.status(404).json({ error: 'Equipo no encontrado' });
    }
    res.status(200).json(equipo);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener el equipo' });
  }
};

export const actualizarEquipo = async (req, res) => {
  try {
    const equipo = await Equipo.findByPk(req.params.id);
    if (!equipo) {
      return res.status(404).json({ error: 'Equipo no encontrado' });
    }
    await equipo.update(req.body);
    res.status(200).json(equipo);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar el equipo' });
  }
};

export const eliminarEquipo = async (req, res) => {
  try {
    const equipo = await Equipo.findByPk(req.params.id);
    if (!equipo) {
      return res.status(404).json({ error: 'Equipo no encontrado' });
    }

    // Verificar si el equipo está asociado a un Mantenimiento
    const mantenimiento = await Mantenimiento.findOne({ where: { equipo_id: req.params.id } });
    if (mantenimiento) {
      return res.status(400).json({ error: 'No se puede eliminar el equipo porque está asociado a un mantenimiento.' });
    }

    // Verificar si el equipo está asociado a una Orden de Mantenimiento
    const ordenMantenimiento = await OrdenMantenimiento.findOne({ where: { equipo_id: req.params.id } });
    if (ordenMantenimiento) {
      return res.status(400).json({ error: 'No se puede eliminar el equipo porque está asociado a una orden de mantenimiento.' });
    }

    // Verificar si el equipo está asociado a un Mantenimiento Preventivo
    const mantenimientoPreventivo = await MantenimientoPreventivo.findOne({ where: { equipo_id: req.params.id } });
    if (mantenimientoPreventivo) {
      return res.status(400).json({ error: 'No se puede eliminar el equipo porque está asociado a un mantenimiento preventivo.' });
    }

    // Si no está asociado a ningún mantenimiento, orden o preventivo, eliminar el equipo
    await equipo.destroy();
    res.status(200).json({ mensaje: 'Equipo eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar el equipo' });
  }
};

// Nueva función para buscar equipos por sucursal_id
export const listarEquiposPorSucursal = async (req, res) => {
  try {
    const equipos = await Equipo.findAll({
      where: { sucursal_id: req.params.sucursal_id }
    });
    if (equipos.length === 0) {
      return res.status(404).json({ error: 'No se encontraron equipos para la sucursal indicada' });
    }
    res.status(200).json(equipos);
  } catch (error) {
    res.status(500).json({ error: 'Error al listar los equipos por sucursal' });
  }
};