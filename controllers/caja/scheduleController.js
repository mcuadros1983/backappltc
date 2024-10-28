import Schedule from "../../models/caja/scheduleModel.js"; // Importar el modelo de schedule
import { Op } from "sequelize";
import moment from "moment-timezone"; // Instalar moment-timezone para gestionar las zonas horarias

// Obtener todos los horarios de sincronización
const obtenerHorarios = async (req, res, next) => {
  try {
    const horarios = await Schedule.findAll();
    res.status(200).json(horarios);
  } catch (error) {
    console.error("Error al obtener los horarios:", error);
    next(error);
  }
};

// Obtener un horario por su ID
const obtenerHorarioPorId = async (req, res, next) => {
  try {
    const { id } = req.params;
    const horario = await Schedule.findByPk(id);
    if (!horario) {
      res.status(404).json({ message: "Horario no encontrado" });
    } else {
      res.status(200).json(horario);
    }
  } catch (error) {
    console.error("Error al obtener el horario por ID:", error);
    next(error);
  }
};

// Crear un nuevo horario
const crearHorario = async (req, res, next) => {
  try {
    const { hour, minute } = req.body;
    const nuevoHorario = await Schedule.create({
      hour,
      minute,
    });
    res.status(201).json(nuevoHorario);
  } catch (error) {
    console.error("Error al crear el horario:", error);
    next(error);
  }
};

// Actualizar un horario existente
const actualizarHorario = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { hour, minute } = req.body;
    const [updatedRows] = await Schedule.update(
      { hour, minute },
      { where: { id } }
    );
    if (updatedRows === 0) {
      res.status(404).json({ message: "Horario no encontrado" });
    } else {
      res.status(200).json({ message: "Horario actualizado correctamente" });
    }
  } catch (error) {
    console.error("Error al actualizar el horario:", error);
    next(error);
  }
};

// Eliminar un horario
const eliminarHorario = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deletedRows = await Schedule.destroy({ where: { id } });
    if (deletedRows === 0) {
      res.status(404).json({ message: "Horario no encontrado" });
    } else {
      res.status(200).json({ message: "Horario eliminado correctamente" });
    }
  } catch (error) {
    console.error("Error al eliminar el horario:", error);
    next(error);
  }
};

export {
  obtenerHorarios,
  obtenerHorarioPorId,
  crearHorario,
  actualizarHorario,
  eliminarHorario,
};
