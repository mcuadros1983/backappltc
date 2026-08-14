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