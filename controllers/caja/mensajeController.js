import Message from "../../models/caja/mensajeModel.js"; // Importar el modelo de mensaje
import { Op } from "sequelize";
import moment from "moment-timezone";

// Obtener todos los mensajes
const obtenerMensajes = async (req, res, next) => {
    try {
      const mensajes = await Message.findAll();
  
      // Convertir `scheduleTime` a la zona horaria local antes de enviarlo
      const mensajesConvertidos = mensajes.map(mensaje => {
        return {
          ...mensaje.toJSON(),
          scheduleTime: moment(mensaje.scheduleTime).tz('America/Argentina/Buenos_Aires').format() // Ajustar la zona horaria según corresponda
        };
      });
  
      console.log("mensajes convertidos", mensajesConvertidos);
      res.status(200).json(mensajesConvertidos);
    } catch (error) {
      console.error("Error al obtener los mensajes:", error);
      next(error);
    }
  };
  
  // Crear un nuevo mensaje
  const crearMensaje = async (req, res, next) => {
    try {
      const { text, scheduleTime } = req.body;
  
      // Convertir el tiempo a UTC antes de guardarlo
      const scheduleTimeUTC = moment.tz(scheduleTime, 'America/Argentina/Buenos_Aires').utc().format();
  
      const nuevoMensaje = await Message.create({
        text,
        scheduleTime: scheduleTimeUTC, // Guardar en UTC
      });
  
      res.status(201).json(nuevoMensaje);
    } catch (error) {
      console.error("Error al crear el mensaje:", error);
      next(error);
    }
  };
  
  // Actualizar un mensaje existente
  const actualizarMensaje = async (req, res, next) => {
    try {
      const { id } = req.params;
      const { text, scheduleTime } = req.body;
  
      // Convertir el tiempo a UTC antes de guardarlo
      const scheduleTimeUTC = moment.tz(scheduleTime, 'America/Argentina/Buenos_Aires').utc().format();
  
      const [updatedRows] = await Message.update(
        { text, scheduleTime: scheduleTimeUTC }, // Guardar en UTC
        { where: { id } }
      );
  
      if (updatedRows === 0) {
        res.status(404).json({ message: "Mensaje no encontrado" });
      } else {
        res.status(200).json({ message: "Mensaje actualizado correctamente" });
      }
    } catch (error) {
      console.error("Error al actualizar el mensaje:", error);
      next(error);
    }
  };
  
  // Obtener un mensaje por su ID
  const obtenerMensajePorId = async (req, res, next) => {
      try {
        const { id } = req.params;
        const mensaje = await Message.findByPk(id);
    
        if (!mensaje) {
          res.status(404).json({ message: "Mensaje no encontrado" });
        } else {
          // Convertir `scheduleTime` a la zona horaria local antes de enviarlo
          const mensajeConvertido = {
            ...mensaje.toJSON(),
            scheduleTime: moment(mensaje.scheduleTime).tz('America/Argentina/Buenos_Aires').format() // Ajustar la zona horaria según corresponda
          };
          res.status(200).json(mensajeConvertido);
        }
      } catch (error) {
        console.error("Error al obtener el mensaje por ID:", error);
        next(error);
      }
    };
  
    // Eliminar un mensaje
  const eliminarMensaje = async (req, res, next) => {
      try {
        const { id } = req.params;
        const deletedRows = await Message.destroy({ where: { id } });
        
        if (deletedRows === 0) {
          res.status(404).json({ message: "Mensaje no encontrado" });
        } else {
          res.status(200).json({ message: "Mensaje eliminado correctamente" });
        }
      } catch (error) {
        console.error("Error al eliminar el mensaje:", error);
        next(error);
      }
    };
    
  
  export {
    obtenerMensajes,
    obtenerMensajePorId,
    crearMensaje,
    actualizarMensaje,
    eliminarMensaje,
  };
  