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

    /*
    |--------------------------------------------------------------------------
    | 1. CONEXIÓN BASE DE DATOS
    |--------------------------------------------------------------------------
    */

    console.log(
      "[STARTUP] Conectando a PostgreSQL..."
    );

    await sequelize.authenticate();

    console.log(
      "✅ Connection has been established successfully."
    );


    /*
    |--------------------------------------------------------------------------
    | 2. SINCRONIZAR MODELOS
    |--------------------------------------------------------------------------
    */

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

        console.log(
          `[SYNC] OK: ${nombre} (${Date.now() - inicio} ms)`
        );

      } catch (error) {

        console.error(
          `[SYNC] ERROR: ${nombre}`
        );

        console.error(error);

        throw error;
      }
    }

    console.log(
      "[SYNC] ✅ Todos los modelos sincronizados."
    );


    /*
    |--------------------------------------------------------------------------
    | 3. SEED MOTOR CONCEPTOS
    |--------------------------------------------------------------------------
    */

    console.log(
      "[STARTUP] Iniciando seedEntidadTipos..."
    );

    await motorConceptoService.seedEntidadTipos();

    console.log(
      "[STARTUP] ✅ seedEntidadTipos finalizado"
    );


    /*
    |--------------------------------------------------------------------------
    | 4. NOTIFICACIONES
    |--------------------------------------------------------------------------
    */

    console.log(
      "[STARTUP] Ejecutando notificationSeeder..."
    );

    await notificationSeeder();

    console.log(
      "[STARTUP] ✅ notificationSeeder finalizado"
    );


    /*
    |--------------------------------------------------------------------------
    | 5. SCHEDULER SEEDER
    |--------------------------------------------------------------------------
    */

    console.log(
      "[STARTUP] Ejecutando schedulerSeeder..."
    );

    await schedulerSeeder();

    console.log(
      "[STARTUP] ✅ schedulerSeeder finalizado"
    );


    /*
    |--------------------------------------------------------------------------
    | 6. SUBSCRIBERS
    |--------------------------------------------------------------------------
    */

    console.log(
      "[STARTUP] Registrando subscribers..."
    );

    registerSubscribers();

    console.log(
      "[STARTUP] ✅ Subscribers registrados"
    );


    /*
    |--------------------------------------------------------------------------
    | 7. CARGAR SCHEDULER
    |--------------------------------------------------------------------------
    */

    console.log(
      "[STARTUP] Cargando scheduler..."
    );

    await schedulerLoader.load();

    console.log(
      "[STARTUP] ✅ Scheduler cargado"
    );


    /*
    |--------------------------------------------------------------------------
    | 8. INICIAR SCHEDULER
    |--------------------------------------------------------------------------
    */

    console.log(
      "[STARTUP] Iniciando scheduler..."
    );

    await schedulerService.start();

    console.log(
      "[STARTUP] ✅ Scheduler iniciado"
    );


    /*
    |--------------------------------------------------------------------------
    | 9. LEVANTAR SERVIDOR
    |--------------------------------------------------------------------------
    */

    const server = app.listen(PORT, () => {

      console.log(
        `🚀 Server is listening on port ${PORT}`
      );

    });


    /*
    |--------------------------------------------------------------------------
    | 10. WEBSOCKET
    |--------------------------------------------------------------------------
    */

    const wss =
      new WebSocketServer({
        server,
      });

    wss.on(
      "connection",
      (ws) => {

        console.log(
          "Cliente conectado a WebSocket"
        );

        handleWebSocketConnection(ws);

      }
    );


    /*
    |--------------------------------------------------------------------------
    | 11. JOB FIDELIZACIÓN
    |--------------------------------------------------------------------------
    */

    setInterval(
      async () => {

        try {

          await runFidelizacionJobs();

        } catch (error) {

          console.error(
            "[FIDELIZACION JOB] Error:",
            error
          );

        }

      },
      1000 * 60 * 60
    );


    console.log(
      "===================================="
    );

    console.log(
      "✅ BACKEND INICIADO CORRECTAMENTE"
    );

    console.log(
      "===================================="
    );

  } catch (error) {

    console.error(
      "❌ ERROR DURANTE EL STARTUP:"
    );

    console.error(error);

    process.exit(1);
  }
}

main();

