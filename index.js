import app from "./app.js";
// import { db } from "./config/config.js";
import { PORT, LOCAL_HOST } from "./config/config.js";
import { sequelize } from "./config/database.js";
// import "./models/gmedias/clienteModel.js";
// import "./models/gmedias/productoModel.js";
// import "./models/gmedias/productoIdModel.js";
// import "./models/gmedias/ventaModel.js";
// import "./models/gmedias/formaPagoModel.js";
// import "./models/gmedias/cuentaCorrienteModel.js";
// import "./models/gmedias/detalleCuentaCorrienteModel.js";
// import "./models/gmedias/cobranzaModel.js";
// import "./models/gmedias/detalleCobranzaModel.js";
// import "./models/gmedias/sucursalModel.js";
import "./libs/configuracionInicial.js";
import { WebSocketServer } from "ws"; // Importar WebSocket
import { handleWebSocketConnection } from "./websocket.js"; // Manejar eventos de WebSocket

// import "./models/detalleVentaModel.js";

async function main() {
  try {
    // await sequelize.authenticate();
    console.log("Connection has been established successfully.");

    // Sincroniza las tablas después de que el servidor esté escuchando
    const server = app.listen(PORT, async () => {
      console.log(`Server is listening on port ${PORT}`);
      
    });



    // Inicializar WebSocket
    const wss = new WebSocketServer({ server });

    // Manejar las conexiones de WebSocket
    wss.on("connection", (ws) => {
      console.log("Cliente conectado a WebSocket");

      // Manejar eventos de WebSocket en archivo separado
      handleWebSocketConnection(ws);
    });

    // Sincroniza las tablas después de que el servidor esté escuchando
    // await sequelize.sync({ force: true });
    //await sequelize.sync({ alter: true }); // alter: true evita que se borren las tablas para recrearlas pero crea las nuevas
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
}

main();
