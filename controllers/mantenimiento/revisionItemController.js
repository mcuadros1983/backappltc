// controllers/revisionItemController.js
import RevisionItem from '../../models/mantenimiento/revisionItemModel.js';
import ItemEquipo from '../../models/mantenimiento/itemEquipoModel.js';

// Crear una nueva revisión para un Item
export const crearRevisionItem = async (req, res) => {
  try {
    const { fecha_revision, estado, comentarios, item_equipo_id } = req.body;

    // Verificar si el item existe antes de crear la revisión
    const item = await ItemEquipo.findByPk(item_equipo_id);
    if (!item) {
      return res.status(404).json({ error: 'Item del equipo no encontrado' });
    }

    const revision = await RevisionItem.create({ fecha_revision, estado, comentarios, item_equipo_id });
    res.status(201).json(revision);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear la revisión del item' });
  }
};

// Listar todas las revisiones de un Item
export const listarRevisionesPorItem = async (req, res) => {
  try {
    const revisiones = await RevisionItem.findAll({ where: { item_equipo_id: req.params.item_equipo_id } });
    res.status(200).json(revisiones);
  } catch (error) {
    res.status(500).json({ error: 'Error al listar las revisiones del item' });
  }
};

// Obtener una revisión por su ID
export const obtenerRevisionPorId = async (req, res) => {
  try {
    const revision = await RevisionItem.findByPk(req.params.id);
    if (!revision) {
      return res.status(404).json({ error: 'Revisión del item no encontrada' });
    }
    res.status(200).json(revision);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener la revisión del item' });
  }
};

// Actualizar una revisión del Item
export const actualizarRevisionItem = async (req, res) => {
  try {
    const revision = await RevisionItem.findByPk(req.params.id);
    if (!revision) {
      return res.status(404).json({ error: 'Revisión del item no encontrada' });
    }
    await revision.update(req.body);
    res.status(200).json(revision);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar la revisión del item' });
  }
};

// Eliminar una revisión del Item
export const eliminarRevisionItem = async (req, res) => {
  try {
    const revision = await RevisionItem.findByPk(req.params.id);
    if (!revision) {
      return res.status(404).json({ error: 'Revisión del item no encontrada' });
    }
    await revision.destroy();
    res.status(200).json({ mensaje: 'Revisión del item eliminada correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar la revisión del item' });
  }
};
