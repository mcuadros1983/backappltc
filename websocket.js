// // Este archivo manejará la conexión WebSocket y los eventos

// let clients = [];

// export function handleWebSocketConnection(ws) {
//   // Guardar el cliente conectado
//   clients.push(ws);

//   // Manejar mensajes desde el cliente (si es necesario)
//   ws.on("message", (message) => {
//     console.log("Mensaje recibido del cliente:", message);
//     // Aquí puedes manejar mensajes que lleguen desde Electron o el frontend
//   });

//   // Manejar cierre de conexión
//   ws.on("close", () => {
//     console.log("Cliente desconectado de WebSocket");
//     clients = clients.filter(client => client !== ws);
//   });
// }

// // Función para enviar mensaje a todos los clientes conectados
// export function broadcastToClients(data) {
//   clients.forEach((client) => {
//     if (client.readyState === client.OPEN) {
//       client.send(JSON.stringify(data)); // Enviar datos a Electron o el frontend
//     }
//   });
// }

let clients = [];

export function handleWebSocketConnection(ws) {
  clients.push(ws);
  console.log("Cliente WebSocket conectado. Total clientes:", clients.length);

  ws.on("message", (message) => {
    try {
      const text = message?.toString?.() || "";
      console.log("Mensaje recibido del cliente WS:", text);
    } catch (error) {
      console.error("Error leyendo mensaje WS:", error.message);
    }
  });

  ws.on("close", () => {
    clients = clients.filter((client) => client !== ws);
    console.log("Cliente WebSocket desconectado. Total clientes:", clients.length);
  });

  ws.on("error", (error) => {
    console.error("Error en cliente WebSocket:", error.message);
  });
}

export function broadcastToClients(data) {
  const payload = JSON.stringify(data);

  clients.forEach((client) => {
    try {
      if (client.readyState === client.OPEN) {
        client.send(payload);
      }
    } catch (error) {
      console.error("Error enviando mensaje WS a cliente:", error.message);
    }
  });
}