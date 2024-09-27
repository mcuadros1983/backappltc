// controllers/equipoController.js
import Equipo from "../../models/mantenimiento/equipoModel.js";
import Mantenimiento from "../../models/mantenimiento/mantenimientoModel.js";
import OrdenMantenimiento from "../../models/mantenimiento/ordenMantenimientoModel.js";
import MantenimientoPreventivo from "../../models/mantenimiento/mantenimientoPreventivoModel.js";
import ItemEquipo from "../../models/mantenimiento/itemEquipoModel.js";
import RevisionItem from "../../models/mantenimiento/revisionItemModel.js";
import EquipoItem from "../../models/mantenimiento/equipoItemModel.js";
import { Op } from 'sequelize'; // Importar Op desde Sequelize

// export const crearEquipo = async (req, res) => {
//   try {
//     // console.log("req.body", req.body)
//     const { items, ...equipoData } = req.body;
//     console.log("items",items)
//     console.log("equipoData", equipoData)
//     // Crear el equipo
//     const equipo = await Equipo.create(equipoData);

//     // Si vienen items asociados, crearlos y asociarlos al equipo
//     if (items && items.length > 0) {
//       const itemsCreados = await Promise.all(
//         items.map(async (item) => {
//           return await ItemEquipo.create({ ...item, equipo_id: equipo.id });
//         })
//       );
//       equipo.dataValues.items = itemsCreados;
//     }

//     res.status(201).json(equipo);
//   } catch (error) {
//     res.status(500).json({ error: 'Error al crear el equipo' });
//   }
// };

export const crearEquipo = async (req, res) => {
  try {
    const { items, ...equipoData } = req.body;

    // Crear el equipo
    const equipo = await Equipo.create(equipoData);

    // Si vienen items asociados, crearlos y asociarlos al equipo usando la tabla intermedia
    if (items && items.length > 0) {
      const itemsCreados = await Promise.all(
        items.map(async (item) => {
          // Crear el item primero
          const itemCreado = await ItemEquipo.create(item);
          // Asociar el item con el equipo usando la tabla intermedia
          await EquipoItem.create({
            equipo_id: equipo.id,
            item_id: itemCreado.id,
          });
          return itemCreado;
        })
      );
      // Añadir los items creados al equipo para la respuesta
      equipo.dataValues.items = itemsCreados;
    }

    res.status(201).json(equipo);
  } catch (error) {
    console.error('Error al crear el equipo:', error);
    res.status(500).json({ error: 'Error al crear el equipo' });
  }
};

// export const listarEquipos = async (req, res) => {
//   try {
//     const equipos = await Equipo.findAll({
//       include: [
//         {
//           model: ItemEquipo,
//           // include: [RevisionItem], // Incluye las revisiones de los items
//         },
//       ],
//     });
//     res.status(200).json(equipos);
//   } catch (error) {
//     res.status(500).json({ error: 'Error al listar los equipos' });
//   }
// };

export const listarEquipos = async (req, res) => {
  try {
    const equipos = await Equipo.findAll({
      include: [
        {
          model: ItemEquipo,
          attributes: ['id', 'nombre', 'descripcion', 'estado'],
          through: {
            attributes: [], // Excluye los atributos de la tabla intermedia si no necesitas mostrarlos
          },
        },
      ],
    });

    res.status(200).json(equipos);
  } catch (error) {
    console.error('Error al listar los equipos:', error);
    res.status(500).json({ error: 'Error al listar los equipos' });
  }
};

// export const obtenerEquipoPorId = async (req, res) => {
//   try {
//     const equipo = await Equipo.findByPk(req.params.id, {
//       include: [
//         {
//           model: ItemEquipo,
//           include: [RevisionItem], // Incluye las revisiones de los items
//         },
//       ],
//     });
//     if (!equipo) {
//       return res.status(404).json({ error: 'Equipo no encontrado' });
//     }
//     res.status(200).json(equipo);
//   } catch (error) {
//     res.status(500).json({ error: 'Error al obtener el equipo' });
//   }
// };

// Controller para obtener un equipo por ID, incluyendo los ítems
export const obtenerEquipoPorId = async (req, res) => {
  try {
    const equipo = await Equipo.findByPk(req.params.id, {
      include: [
        {
          model: ItemEquipo,
          attributes: ['id', 'nombre', 'descripcion', 'estado'], // Ajusta los atributos según tu modelo
          through: {
            attributes: [], // Excluye atributos de la tabla intermedia si no necesitas mostrarlos
          },
        },
      ],
    });

    if (!equipo) {
      return res.status(404).json({ error: 'Equipo no encontrado' });
    }

    res.status(200).json(equipo);
  } catch (error) {
    console.error('Error al obtener el equipo:', error);
    res.status(500).json({ error: 'Error al obtener el equipo' });
  }
};

// export const actualizarEquipo = async (req, res) => {
//   try {
//     const { items, ...equipoData } = req.body;

//     const equipo = await Equipo.findByPk(req.params.id, {
//       include: [ItemEquipo], // Incluye los items para la actualización
//     });

//     if (!equipo) {
//       return res.status(404).json({ error: 'Equipo no encontrado' });
//     }

//     // Actualizar los datos del equipo
//     await equipo.update(equipoData);

//     // Si vienen items en la actualización, procesarlos
//     if (items && items.length > 0) {
//       for (const item of items) {
//         if (item.id) {
//           // Actualiza el item si existe
//           const existingItem = await ItemEquipo.findByPk(item.id);
//           if (existingItem) {
//             await existingItem.update(item);
//           }
//         } else {
//           // Crea el item si es nuevo
//           await ItemEquipo.create({ ...item, equipo_id: equipo.id });
//         }
//       }
//     }

//     res.status(200).json(equipo);
//   } catch (error) {
//     res.status(500).json({ error: 'Error al actualizar el equipo' });
//   }
// };


export const actualizarEquipo = async (req, res) => {
  try {
    const { items, ...equipoData } = req.body;

    // Buscar el equipo e incluir los ítems
    const equipo = await Equipo.findByPk(req.params.id, {
      include: [ItemEquipo],
    });

    if (!equipo) {
      return res.status(404).json({ error: 'Equipo no encontrado' });
    }

    // Actualizar los datos del equipo
    await equipo.update(equipoData);

    // Procesar los ítems
    if (items && items.length > 0) {
      // Obtener los IDs de los ítems existentes
      const existingItemIds = items.filter((item) => item.id).map((item) => item.id);

      // Eliminar relaciones de ítems que no están en la actualización de la tabla intermedia
      await EquipoItem.destroy({
        where: {
          equipo_id: equipo.id,
          item_id: { [Op.notIn]: existingItemIds },
        },
      });

      // Eliminar ítems que ya no están asociados a ningún equipo
      await ItemEquipo.destroy({
        where: {
          id: { [Op.notIn]: existingItemIds },
        },
      });

      // Crear o actualizar ítems
      for (const item of items) {
        if (item.id) {
          // Actualiza el ítem si existe
          const existingItem = await ItemEquipo.findByPk(item.id);
          if (existingItem) {
            await existingItem.update(item);
          }
        } else {
          // Crear el ítem y asociarlo con el equipo a través de la tabla intermedia
          const itemCreado = await ItemEquipo.create(item);
          await EquipoItem.create({
            equipo_id: equipo.id,
            item_id: itemCreado.id,
          });
        }
      }
    } else {
      // Si no hay ítems, elimina todas las relaciones de ítems del equipo en la tabla intermedia
      const equipoItems = await EquipoItem.findAll({ where: { equipo_id: equipo.id } });

      // Obtener los IDs de los ítems asociados para eliminarlos
      const itemIds = equipoItems.map((equipoItem) => equipoItem.item_id);

      // Eliminar las relaciones en la tabla intermedia
      await EquipoItem.destroy({ where: { equipo_id: equipo.id } });

      // Eliminar los ítems asociados
      if (itemIds.length > 0) {
        await ItemEquipo.destroy({ where: { id: { [Op.in]: itemIds } } });
      }
    }

    // Refresca el equipo con los ítems actualizados
    const equipoActualizado = await Equipo.findByPk(req.params.id, {
      include: [ItemEquipo],
    });

    res.status(200).json(equipoActualizado);
  } catch (error) {
    console.error('Error al actualizar el equipo:', error);
    res.status(500).json({ error: 'Error al actualizar el equipo' });
  }
};


// export const eliminarEquipo = async (req, res) => {
//   try {
//     const equipo = await Equipo.findByPk(req.params.id);
//     if (!equipo) {
//       return res.status(404).json({ error: 'Equipo no encontrado' });
//     }

//     // Verificar si el equipo está asociado a un Mantenimiento
//     const mantenimiento = await Mantenimiento.findOne({ where: { equipo_id: req.params.id } });
//     if (mantenimiento) {
//       return res.status(400).json({ error: 'No se puede eliminar el equipo porque está asociado a un mantenimiento.' });
//     }

//     // Verificar si el equipo está asociado a una Orden de Mantenimiento
//     const ordenMantenimiento = await OrdenMantenimiento.findOne({ where: { equipo_id: req.params.id } });
//     if (ordenMantenimiento) {
//       return res.status(400).json({ error: 'No se puede eliminar el equipo porque está asociado a una orden de mantenimiento.' });
//     }

//     // Verificar si el equipo está asociado a un Mantenimiento Preventivo
//     const mantenimientoPreventivo = await MantenimientoPreventivo.findOne({ where: { equipo_id: req.params.id } });
//     if (mantenimientoPreventivo) {
//       return res.status(400).json({ error: 'No se puede eliminar el equipo porque está asociado a un mantenimiento preventivo.' });
//     }

//     // Verificar si el equipo tiene Items asociados
//     const items = await ItemEquipo.findAll({ where: { equipo_id: req.params.id } });
//     if (items.length > 0) {
//       // Eliminar todas las revisiones de los items
//       await Promise.all(items.map(async (item) => {
//         await RevisionItem.destroy({ where: { item_equipo_id: item.id } });
//       }));

//       // Eliminar los items asociados
//       await ItemEquipo.destroy({ where: { equipo_id: req.params.id } });
//     }

//     // Si no está asociado a ningún mantenimiento, orden, preventivo, o tiene items, eliminar el equipo
//     await equipo.destroy();
//     res.status(200).json({ mensaje: 'Equipo eliminado correctamente' });
//   } catch (error) {
//     res.status(500).json({ error: 'Error al eliminar el equipo' });
//   }
// };

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

    // Obtener los IDs de los items asociados al equipo desde la tabla intermedia
    const equipoItems = await EquipoItem.findAll({
      where: { equipo_id: req.params.id },
    });

    if (equipoItems.length > 0) {
      const itemIds = equipoItems.map(ei => ei.item_id);

      // Eliminar todas las revisiones de los items asociados
      // await RevisionItem.destroy({ where: { item_equipo_id: { [Op.in]: itemIds } } });

      // Eliminar las relaciones en la tabla intermedia
      await EquipoItem.destroy({ where: { equipo_id: req.params.id } });

      // Eliminar los items asociados
      await ItemEquipo.destroy({ where: { id: { [Op.in]: itemIds } } });
    }

    // Si no está asociado a ningún mantenimiento, orden, preventivo, o tiene items, eliminar el equipo
    await equipo.destroy();
    res.status(200).json({ mensaje: 'Equipo eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar el equipo:', error);
    res.status(500).json({ error: 'Error al eliminar el equipo' });
  }
};

// // Nueva función para buscar equipos por sucursal_id
// export const listarEquiposPorSucursal = async (req, res) => {
//   try {
//     const equipos = await Equipo.findAll({
//       where: { sucursal_id: req.params.sucursal_id },
//       include: [
//         {
//           model: ItemEquipo,
//           include: [RevisionItem], // Incluye las revisiones de los items
//         },
//       ],
//     });
//     if (equipos.length === 0) {
//       return res.status(404).json({ error: 'No se encontraron equipos para la sucursal indicada' });
//     }
//     res.status(200).json(equipos);
//   } catch (error) {
//     res.status(500).json({ error: 'Error al listar los equipos por sucursal' });
//   }
// };


// Nueva función para buscar equipos por sucursal_id
export const listarEquiposPorSucursal = async (req, res) => {
  try {
    const equipos = await Equipo.findAll({
      where: { sucursal_id: req.params.sucursal_id },
      include: [
        {
          model: ItemEquipo,
          attributes: ['id', 'nombre', 'descripcion', 'estado'],
          through: {
            model: EquipoItem, // Usa la tabla intermedia para la relación
            attributes: [], // No necesitas incluir atributos de la tabla intermedia
          },
          // include: [
          //   {
          //     model: RevisionItem, // Asegúrate de que esta relación esté definida en los modelos
          //     attributes: ['id', 'detalle', 'fecha', 'estado'], // Incluye los campos necesarios
          //   },
          // ],
        },
      ],
    });

    if (equipos.length === 0) {
      return res.status(404).json({ error: 'No se encontraron equipos para la sucursal indicada' });
    }

    res.status(200).json(equipos);
  } catch (error) {
    console.error('Error al listar los equipos por sucursal:', error);
    res.status(500).json({ error: 'Error al listar los equipos por sucursal' });
  }
};
