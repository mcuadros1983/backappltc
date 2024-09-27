// controllers/itemEquipoController.js
import ItemEquipo from '../../models/mantenimiento/itemEquipoModel.js';
import Equipo from '../../models/mantenimiento/equipoModel.js';
import RevisionItem from '../../models/mantenimiento/revisionItemModel.js';

// Crear un nuevo Item para un Equipo
export const crearItemEquipo = async (req, res) => {
  try {
    const { nombre, descripcion, estado, equipo_id } = req.body;

    // Verificar si el equipo existe antes de agregar un item
    const equipo = await Equipo.findByPk(equipo_id);
    if (!equipo) {
      return res.status(404).json({ error: 'Equipo no encontrado' });
    }

    const item = await ItemEquipo.create({ nombre, descripcion, estado, equipo_id });
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear el item del equipo' });
  }
};

// Listar todos los Items de un Equipo
export const listarItemsPorEquipo = async (req, res) => {
  try {
    const items = await ItemEquipo.findAll({
      where: { equipo_id: req.params.equipo_id },
      include: [RevisionItem], // Incluye las revisiones de cada item
    });
    res.status(200).json(items);
  } catch (error) {
    res.status(500).json({ error: 'Error al listar los items del equipo' });
  }
};

// Obtener un Item por su ID
export const obtenerItemPorId = async (req, res) => {
  try {
    const item = await ItemEquipo.findByPk(req.params.id, {
      include: [RevisionItem], // Incluye las revisiones asociadas
    });
    if (!item) {
      return res.status(404).json({ error: 'Item del equipo no encontrado' });
    }
    res.status(200).json(item);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener el item del equipo' });
  }
};

// Actualizar un Item del Equipo
export const actualizarItemEquipo = async (req, res) => {
  try {
    const item = await ItemEquipo.findByPk(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Item del equipo no encontrado' });
    }
    await item.update(req.body);
    res.status(200).json(item);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar el item del equipo' });
  }
};

// Eliminar un Item del Equipo
export const eliminarItemEquipo = async (req, res) => {
  try {
    const item = await ItemEquipo.findByPk(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Item del equipo no encontrado' });
    }

    // Eliminar las revisiones asociadas al item
    await RevisionItem.destroy({ where: { item_equipo_id: item.id } });

    // Eliminar el item
    await item.destroy();
    res.status(200).json({ mensaje: 'Item del equipo eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar el item del equipo' });
  }
};
