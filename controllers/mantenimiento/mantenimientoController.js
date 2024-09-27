import Mantenimiento from "../../models/mantenimiento/mantenimientoModel.js";
import Equipo from "../../models/mantenimiento/equipoModel.js";
import ItemEquipo from "../../models/mantenimiento/itemEquipoModel.js";
import RevisionItem from "../../models/mantenimiento/revisionItemModel.js";
import ItemRevision from "../../models/mantenimiento/itemRevisionModel.js";

// Crear un nuevo mantenimiento con revisiones asociadas
export const crearMantenimiento = async (req, res) => {
  try {
    const {
      fecha_inicio,
      fecha_fin,
      equipo_id,
      tecnico_id,
      firmante_id,
      detalle,
      observaciones,
      orden_mantenimiento_id,
      mantenimiento_preventivo_id,
      nombre_firmante,
      terminado,
      sucursal_id,
      revisiones = [],
    } = req.body;

    // Validación del campo terminado
    if (typeof terminado !== "boolean") {
      return res.status(400).json({
        error:
          "El campo 'terminado' es obligatorio y debe ser un valor booleano.",
      });
    }

    // Crear el mantenimiento
    const mantenimiento = await Mantenimiento.create({
      equipo_id,
      tecnico_id,
      firmante_id,
      detalle,
      observaciones: observaciones || null,
      orden_mantenimiento_id: orden_mantenimiento_id || null,
      mantenimiento_preventivo_id: mantenimiento_preventivo_id || null,
      nombre_firmante: nombre_firmante || null,
      fecha_inicio: fecha_inicio || null,
      fecha_fin: fecha_fin || null,
      terminado,
      sucursal_id,
    });

    // Crear revisiones para los ítems asociados al equipo si existen revisiones desde el frontend
    if (revisiones.length > 0) {
      await Promise.all(
        revisiones.map(async (revision) => {
          // Crear la revisión asociando el ítem y el mantenimiento
          await RevisionItem.create({
            item_equipo_id: revision.item_equipo_id, // ID del ítem proporcionado por el frontend
            mantenimiento_id: mantenimiento.id, // ID del mantenimiento recién creado
            estado: revision.estado || null,
            comentarios: revision.comentarios || null,
          });
        })
      );
    }

    res.status(201).json(mantenimiento);
  } catch (error) {
    console.error("Error al crear el mantenimiento:", error);
    res.status(500).json({ error: "Error al crear el mantenimiento" });
  }
};

// Listar todos los mantenimientos
// Listar todos los mantenimientos
export const listarMantenimientos = async (req, res) => {
  try {
    // Obtener los mantenimientos junto con los equipos y sus ítems
    const mantenimientos = await Mantenimiento.findAll({
      include: [
        {
          model: Equipo,
          attributes: ["nombre", "marca", "numero_serie", "sucursal_id"],
          include: [
            {
              model: ItemEquipo,
              attributes: ["id", "nombre", "descripcion", "estado"],
              through: { attributes: [] },
            },
          ],
        },
      ],
    });

    // Iterar sobre los mantenimientos para agregar las revisiones a los ítems si existen
    const mantenimientosConRevisiones = await Promise.all(
      mantenimientos.map(async (mantenimiento) => {
        // Obtener las revisiones asociadas a este mantenimiento
        const revisiones = await RevisionItem.findAll({
          where: { mantenimiento_id: mantenimiento.id },
          // include: [
          //   {
          //     model: ItemEquipo,
          //     attributes: ["id", "nombre"], // Incluir los ítems relacionados
          //   },
          // ],
        });

        // Crear un mapa de revisiones para asociarlas a los ítems
        const revisionesPorItem = revisiones.reduce((acc, revision) => {
          if (!acc[revision.item_equipo_id]) {
            acc[revision.item_equipo_id] = [];
          }
          acc[revision.item_equipo_id].push(revision);
          return acc;
        }, {});

        // Añadir las revisiones a los ítems del equipo
        mantenimiento.Equipo.ItemEquipos = mantenimiento.Equipo.ItemEquipos.map((item) => {
          item.dataValues.revisiones = revisionesPorItem[item.id] || [];
          return item;
        });

        return mantenimiento;
      })
    );

    res.status(200).json(mantenimientosConRevisiones);
  } catch (error) {
    console.error("Error al listar los mantenimientos:", error);
    res.status(500).json({ error: "Error al listar los mantenimientos" });
  }
};


// Obtener un mantenimiento por ID
export const obtenerMantenimientoPorId = async (req, res) => {
  try {
    // Buscar el mantenimiento por ID, incluyendo el equipo y los ítems
    const mantenimiento = await Mantenimiento.findByPk(req.params.id, {
      include: [
        {
          model: Equipo,
          attributes: [
            "id",
            "nombre",
            "marca",
            "numero_serie",
            "fecha_compra",
            "ultimo_mantenimiento",
            "sucursal_id",
          ],
          include: [
            {
              model: ItemEquipo,
              attributes: ["id", "nombre", "descripcion", "estado"],
              through: { attributes: [] },
            },
          ],
        },
      ],
    });

    if (!mantenimiento) {
      return res.status(404).json({ error: "Mantenimiento no encontrado" });
    }

    // Obtener las revisiones asociadas al mantenimiento
    const revisiones = await RevisionItem.findAll({
      where: { mantenimiento_id: mantenimiento.id },
      attributes: ["id", "mantenimiento_id", "item_equipo_id", "fecha_revision", "estado", "comentarios"],
    });

    // console.log("revisiones", revisiones)

    res.status(200).json({mantenimiento,revisiones});
  } catch (error) {
    console.error("Error al obtener el mantenimiento:", error);
    res.status(500).json({ error: "Error al obtener el mantenimiento" });
  }
};


// Actualizar un mantenimiento
export const actualizarMantenimiento = async (req, res) => {
  // console.log("body", req.body);
  try {
    const {
      revisiones = [], // Revisiones desde el frontend
      ...mantenimientoData
    } = req.body;

    // Buscar el mantenimiento y sus ítems asociados
    const mantenimiento = await Mantenimiento.findByPk(req.params.id, {
      include: [
        {
          model: Equipo,
          include: [ItemEquipo],
        },
      ],
    });

    if (!mantenimiento) {
      return res.status(404).json({ error: "Mantenimiento no encontrado" });
    }

    // Actualizar los datos del mantenimiento
    await mantenimiento.update(mantenimientoData);

    // Procesar revisiones si vienen desde el frontend
    if (revisiones.length > 0) {
      await Promise.all(
        revisiones.map(async (revision) => {
          // Buscar la revisión existente basada en item_equipo_id y mantenimiento_id
          const existingRevision = await RevisionItem.findOne({
            where: {
              item_equipo_id: revision.item_equipo_id,
              mantenimiento_id: mantenimiento.id,
            },
          });

          if (existingRevision) {
            // Actualizar la revisión si ya existe
            await existingRevision.update({
              estado: revision.estado || null,
              comentarios: revision.comentarios || null,
            });
          } else {
            // Crear una nueva revisión si no existe
            await RevisionItem.create({
              item_equipo_id: revision.item_equipo_id,
              mantenimiento_id: mantenimiento.id,
              estado: revision.estado || null,
              comentarios: revision.comentarios || null,
            });
          }
        })
      );
    }

    res.status(200).json(mantenimiento);
  } catch (error) {
    console.error("Error al actualizar el mantenimiento:", error);
    res.status(500).json({ error: "Error al actualizar el mantenimiento" });
  }
};

export const eliminarMantenimiento = async (req, res) => {
  try {
    const mantenimiento = await Mantenimiento.findByPk(req.params.id);
    if (!mantenimiento) {
      return res.status(404).json({ error: "Mantenimiento no encontrado" });
    }

    await RevisionItem.destroy({
      where: {
        mantenimiento_id: mantenimiento.id, // Asegura eliminar solo revisiones asociadas al mantenimiento
      },
    });

    await mantenimiento.destroy();
    res.status(200).json({ mensaje: "Mantenimiento eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar el mantenimiento" });
  }
};

export const obtenerMantenimientoPorOrdenId = async (req, res) => {
  try {
    const mantenimiento = await Mantenimiento.findOne({
      where: { orden_mantenimiento_id: req.params.orden_mantenimiento_id },
      include: [
        {
          model: Equipo,
          attributes: [
            "id",
            "nombre",
            "marca",
            "numero_serie",
            "fecha_compra",
            "ultimo_mantenimiento",
            "sucursal_id",
          ],
        },
      ],
    });
    if (!mantenimiento) {
      return res.status(404).json({ error: "Mantenimiento no encontrado" });
    }
    res.status(200).json(mantenimiento);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener el mantenimiento" });
  }
};

export const obtenerMantenimientoPorPreventivoId = async (req, res) => {
  try {
    const mantenimiento = await Mantenimiento.findOne({
      where: {
        mantenimiento_preventivo_id: req.params.mantenimiento_preventivo_id,
      },
      include: [
        {
          model: Equipo,
          attributes: [
            "id",
            "nombre",
            "marca",
            "numero_serie",
            "fecha_compra",
            "ultimo_mantenimiento",
            "sucursal_id",
          ],
        },
      ],
    });
    if (!mantenimiento) {
      return res.status(404).json({ error: "Mantenimiento no encontrado" });
    }
    res.status(200).json(mantenimiento);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener el mantenimiento" });
  }
};
