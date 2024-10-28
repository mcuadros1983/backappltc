// Este archivo manejará la conexión WebSocket y los eventos

let clients = [];

export function handleWebSocketConnection(ws) {
  // Guardar el cliente conectado
  clients.push(ws);

  // Manejar mensajes desde el cliente (si es necesario)
  ws.on("message", (message) => {
    console.log("Mensaje recibido del cliente:", message);
    // Aquí puedes manejar mensajes que lleguen desde Electron o el frontend
  });

  // Manejar cierre de conexión
  ws.on("close", () => {
    console.log("Cliente desconectado de WebSocket");
    clients = clients.filter(client => client !== ws);
  });
}

// Función para enviar mensaje a todos los clientes conectados
export function broadcastToClients(data) {
  clients.forEach((client) => {
    if (client.readyState === client.OPEN) {
      client.send(JSON.stringify(data)); // Enviar datos a Electron o el frontend
    }
  });
}