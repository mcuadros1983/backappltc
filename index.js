import "dotenv/config";
import app from "./app.js";
// import { db } from "./config/config.js";
import { PORT, LOCAL_HOST } from "./config/config.js";
import { sequelize } from "./config/database.js";
import "./models/index.js"; // Este define las relaciones
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
import notificationSeeder from "./libs/notificationSeeder.js";
import schedulerSeeder from "./libs/schedulerSeeder.js";

import registerSubscribers from "./services/events/registerSubscribers.js";
import schedulerLoader from "./services/scheduler/schedulerLoader.js";
import schedulerService
  from "./services/scheduler/schedulerService.js";

import { WebSocketServer } from "ws"; // Importar WebSocket
import { handleWebSocketConnection } from "./websocket.js"; // Manejar eventos de WebSocket
import { runFidelizacionJobs } from "./jobs/fidelizacion/fidelizacionJobs.js";
import motorConceptoService
  from "./services/motorconceptos/motorConceptoService.js";

async function main() {
  try {
    // await sequelize.authenticate();
    // console.log("Antes notificationSeeder");
    await notificationSeeder();
    // console.log("Después notificationSeeder");

    // console.log("Antes schedulerSeeder");
    await schedulerSeeder();
    // console.log("Después schedulerSeeder");

    console.log("Connection has been established successfully.");

    // Sincroniza las tablas después de que el servidor esté escuchando
    const server = app.listen(PORT, async () => {
      console.log(`Server is listening on port ${PORT}`);

    });

    setInterval(async () => {
      await runFidelizacionJobs();
    }, 1000 * 60 * 60);

    // Inicializar WebSocket
    const wss = new WebSocketServer({ server });

    // Manejar las conexiones de WebSocket
    wss.on("connection", (ws) => {
      console.log("Cliente conectado a WebSocket");

      // Manejar eventos de WebSocket en archivo separado
      handleWebSocketConnection(ws);
    });

    console.log(
      "[STARTUP] 1 - Iniciando seedEntidadTipos..."
    );

    await motorConceptoService.seedEntidadTipos();

    console.log(
      "[STARTUP] 2 - seedEntidadTipos FINALIZADO"
    );


    // console.log(
    //   "[STARTUP] 3 - Iniciando sequelize.sync..."
    // );

    console.log(
      "[SYNC] Iniciando diagnóstico de modelos..."
    );

    const modelos =
      Object.values(sequelize.models);

    for (const modelo of modelos) {

      const nombre =
        modelo.name;

      const tabla =
        modelo.getTableName();

      console.log(
        `[SYNC] Iniciando: ${nombre} -> ${tabla}`
      );

      const inicio =
        Date.now();

      try {

        await modelo.sync();
        // await modelo.sync({
        //   alter: true,
        // });

        console.log(
          `[SYNC] OK: ${nombre} (${Date.now() - inicio} ms)`
        );

      }
      catch (error) {

        console.error(
          `[SYNC] ERROR: ${nombre}`
        );

        console.error(
          error
        );

        throw error;

      }

    }

    console.log(
      "[SYNC] Todos los modelos sincronizados."
    );

    // await sequelize.sync({
    //   alter: true
    // });

    console.log(
      "[STARTUP] 4 - sequelize.sync FINALIZADO"
    );


    console.log(
      "[STARTUP] 5 - Registrando subscribers..."
    );

    registerSubscribers();

    console.log(
      "[STARTUP] 6 - Subscribers registrados"
    );


    console.log(
      "[STARTUP] 7 - Cargando scheduler..."
    );

    await schedulerLoader.load();

    console.log(
      "[STARTUP] 8 - Scheduler cargado"
    );


    /*
    |--------------------------------------------------------------------------
    | PRUEBA CLIMA
    |--------------------------------------------------------------------------
    */

    console.log(
      "[PRUEBA CLIMA] Ejecutando job manualmente..."
    );

    const resultadoClima =
      await schedulerService.runNow(
        "inteligencia.clima.diario"
      );

    console.log(
      "[PRUEBA CLIMA] Resultado:",
      resultadoClima
    );


    console.log(
      "[STARTUP] 9 - Iniciando scheduler..."
    );

    await schedulerService.start();

    console.log(
      "[STARTUP] 10 - Scheduler iniciado"
    );


  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
}

main();
