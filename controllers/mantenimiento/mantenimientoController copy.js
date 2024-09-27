// controllers/mantenimientoController.js
import Mantenimiento from "../../models/mantenimiento/mantenimientoModel.js";
import Equipo from "../../models/mantenimiento/equipoModel.js";

// export const crearMantenimiento = async (req, res) => {
//   try {
//     const mantenimiento = await Mantenimiento.create(req.body);
//     res.status(201).json(mantenimiento);
//   } catch (error) {
//     res.status(500).json({ error: 'Error al crear el mantenimiento' });
//   }
// };

export const crearMantenimiento = async (req, res) => {
  try {
    const {
      equipo_id,
      tecnico_id,
      firmante_id,
      detalle,
      observaciones,
      orden_mantenimiento_id,
      mantenimiento_preventivo_id,
      nombre_firmante,
      terminado, // Nuevo campo
      sucursal_id,
    } = req.body;

    console.log("body", req.body)

    // Validación del campo terminado
    if (typeof terminado !== "boolean") {
      return res
        .status(400)
        .json({
          error:
            "El campo 'terminado' es obligatorio y debe ser un valor booleano.",
        });
    }

    const mantenimiento = await Mantenimiento.create({
      equipo_id,
      tecnico_id,
      firmante_id,
      detalle,
      observaciones: observaciones || null,
      orden_mantenimiento_id: orden_mantenimiento_id || null,
      mantenimiento_preventivo_id: mantenimiento_preventivo_id || null,
      nombre_firmante: nombre_firmante || null,
      fecha_inicio: new Date(),
      terminado, // Incluir el campo en la creación
      sucursal_id
    });

    res.status(201).json(mantenimiento);
  } catch (error) {
    res.status(500).json({ error: "Error al crear el mantenimiento" });
  }
};

// export const listarMantenimientos = async (req, res) => {
//   try {
//     const mantenimientos = await Mantenimiento.findAll();
//     res.status(200).json(mantenimientos);
//   } catch (error) {
//     res.status(500).json({ error: "Error al listar los mantenimientos" });
//   }
// };
export const listarMantenimientos = async (req, res) => {
  try {
    const mantenimientos = await Mantenimiento.findAll({
      include: {
        model: Equipo,
        attributes: ["nombre", "marca", "numero_serie", "sucursal_id"], // Especifica los campos que deseas incluir de la tabla de equipos
      },
    });
    res.status(200).json(mantenimientos);
  } catch (error) {
    res.status(500).json({ error: "Error al listar los mantenimientos" });
  }
};

// export const obtenerMantenimientoPorId = async (req, res) => {
//   try {
//     const mantenimiento = await Mantenimiento.findByPk(req.params.id);
//     if (!mantenimiento) {
//       return res.status(404).json({ error: "Mantenimiento no encontrado" });
//     }
//     res.status(200).json(mantenimiento);
//   } catch (error) {
//     res.status(500).json({ error: "Error al obtener el mantenimiento" });
//   }
// };
export const obtenerMantenimientoPorId = async (req, res) => {
  try {
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
          ], // Incluye todos los campos que necesitas de Equipo
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

export const actualizarMantenimiento = async (req, res) => {
  try {
    const mantenimiento = await Mantenimiento.findByPk(req.params.id);
    if (!mantenimiento) {
      return res.status(404).json({ error: "Mantenimiento no encontrado" });
    }
    await mantenimiento.update(req.body);
    res.status(200).json(mantenimiento);
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar el mantenimiento" });
  }
};

export const eliminarMantenimiento = async (req, res) => {
  try {
    const mantenimiento = await Mantenimiento.findByPk(req.params.id);
    if (!mantenimiento) {
      return res.status(404).json({ error: "Mantenimiento no encontrado" });
    }
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
      where: { mantenimiento_preventivo_id: req.params.mantenimiento_preventivo_id },
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
