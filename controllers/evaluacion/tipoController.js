import EvaluacionTipo from "../../models/evaluacion/evaluacionTipoModel.js";
import EvaluacionPlantilla from "../../models/evaluacion/evaluacionPlantillaModel.js";

export const listarTiposEvaluacion = async (req, res) => {
  try {
    const rows = await EvaluacionTipo.findAll({
      order: [["id", "ASC"]],
    });

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json(error);
  }
};

export const obtenerTipoEvaluacion = async (req, res) => {
  try {
    const row = await EvaluacionTipo.findByPk(req.params.id);

    if (!row) {
      return res.status(404).json({
        message: "Tipo de evaluación no encontrado",
      });
    }

    res.json(row);
  } catch (error) {
    console.error(error);
    res.status(500).json(error);
  }
};

export const crearTipoEvaluacion = async (req, res) => {
  try {
    const { codigo, descripcion, activo } = req.body;

    if (!codigo) {
      return res.status(400).json({
        message: "El código es obligatorio",
      });
    }

    if (!descripcion) {
      return res.status(400).json({
        message: "La descripción es obligatoria",
      });
    }

    const existe = await EvaluacionTipo.findOne({
      where: { codigo },
    });

    if (existe) {
      return res.status(400).json({
        message: "Ya existe un tipo de evaluación con ese código",
      });
    }

    const row = await EvaluacionTipo.create({
      codigo,
      descripcion,
      activo: activo !== undefined ? activo : true,
    });

    res.status(201).json({
      ok: true,
      row,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json(error);
  }
};

export const actualizarTipoEvaluacion = async (req, res) => {
  try {
    const { id } = req.params;
    const { codigo, descripcion, activo } = req.body;

    const row = await EvaluacionTipo.findByPk(id);

    if (!row) {
      return res.status(404).json({
        message: "Tipo de evaluación no encontrado",
      });
    }

    if (!codigo) {
      return res.status(400).json({
        message: "El código es obligatorio",
      });
    }

    if (!descripcion) {
      return res.status(400).json({
        message: "La descripción es obligatoria",
      });
    }

    const existe = await EvaluacionTipo.findOne({
      where: { codigo },
    });

    if (existe && Number(existe.id) !== Number(id)) {
      return res.status(400).json({
        message: "Ya existe otro tipo de evaluación con ese código",
      });
    }

    await row.update({
      codigo,
      descripcion,
      activo: activo !== undefined ? activo : true,
    });

    res.json({
      ok: true,
      message: "Tipo de evaluación actualizado",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json(error);
  }
};

export const eliminarTipoEvaluacion = async (req, res) => {
  try {
    const row = await EvaluacionTipo.findByPk(req.params.id);

    if (!row) {
      return res.status(404).json({
        message: "Tipo de evaluación no encontrado",
      });
    }

    const cantidadPlantillas = await EvaluacionPlantilla.count({
      where: {
        tipo_id: row.id
      }
    });

    if (cantidadPlantillas > 0) {

      return res.status(400).json({

        message:
          "No se puede eliminar el tipo porque posee plantillas asociadas."

      });

    }

    await row.destroy();

    res.json({
      ok: true,
      message: "Tipo de evaluación eliminado",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json(error);
  }
};