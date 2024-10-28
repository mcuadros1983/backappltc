import { broadcastToClients } from "../../websocket.js"; // Importar la función de WebSocket

// Controlador para enviar una notificación con mensaje personalizado
export const enviarNotificacion = async (req, res) => {
  try {
    // Obtener el mensaje desde el cuerpo de la solicitud (request body)
    const { message } = req.body;

    if (!message || message.trim() === "") {
      return res.status(400).json({ message: "El campo 'message' es requerido." });
    }

    // Enviar la señal de notificación a todos los clientes conectados
    broadcastToClients({ type: "notification", text: message });

    // Responder al cliente HTTP (opcional, si tienes un frontend)
    res.status(200).json({ message: "Notificación enviada." });
  } catch (error) {
    console.error("Error al enviar la notificación:", error);
    res.status(500).json({ message: "Error al enviar la notificación." });
  }
};


// Controlador para enviar una señal de sincronización
export const enviarSync = async (req, res) => {
  try {
    // Enviar la señal de sincronización a todos los clientes conectados
    broadcastToClients({ type: "sync", message: "Sincronización de tablas enviada." });

    // Responder al cliente HTTP (opcional, si tienes un frontend)
    res.status(200).json({ message: "Sincronización completada y señal enviada a través de WebSocket." });
  } catch (error) {
    console.error("Error durante la sincronización:", error);
    res.status(500).json({ message: "Error al ejecutar la sincronización." });
  }
};


// Controlador para enviar una señal de sincronización
export const enviarPromociones = async (req, res) => {
  try {
    // Enviar la señal de sincronización a todos los clientes conectados
    broadcastToClients({ type: "promociones", message: "Sincronización de promociones enviada." });

    // Responder al cliente HTTP (opcional, si tienes un frontend)
    res.status(200).json({ message: "Promociones completada y señal enviada a través de WebSocket." });
  } catch (error) {
    console.error("Error durante la sincronización:", error);
    res.status(500).json({ message: "Error al ejecutar la sincronización." });
  }
};


// Controlador para enviar una señal de sincronización
export const enviarPrecios = async (req, res) => {
  try {
    // Enviar la señal de sincronización a todos los clientes conectados
    broadcastToClients({ type: "precios", message: "Sincronización de precios enviada." });

    // Responder al cliente HTTP (opcional, si tienes un frontend)
    res.status(200).json({ message: "Precios completada y señal enviada a través de WebSocket." });
  } catch (error) {
    console.error("Error durante la sincronización:", error);
    res.status(500).json({ message: "Error al ejecutar la sincronización." });
  }
};

// Controlador para enviar una señal de sincronización
export const enviarTablas = async (req, res) => {
  try {
    // Enviar la señal de sincronización a todos los clientes conectados
    broadcastToClients({ type: "tablas", message: "Sincronización de tablas enviada." });

    // Responder al cliente HTTP (opcional, si tienes un frontend)
    res.status(200).json({ message: "Tablas completada y señal enviada a través de WebSocket." });
  } catch (error) {
    console.error("Error durante la sincronización:", error);
    res.status(500).json({ message: "Error al ejecutar la sincronización." });
  }
};

