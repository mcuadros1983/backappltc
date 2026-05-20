// rindeRouter.js
import { Router } from "express";
import * as syncController from "../../controllers/sync/syncController.js";

const syncRouter = Router();

syncRouter.post("/sync", syncController.enviarSync);

syncRouter.post("/notification", syncController.enviarNotificacion);

syncRouter.post("/syncpromociones", syncController.enviarPromociones);

syncRouter.post("/syncprecios", syncController.enviarPrecios);

syncRouter.post("/synctablas", syncController.enviarTablas);

syncRouter.post("/syncasistencias", syncController.enviarAsistencias);

syncRouter.post("/syncaudio", syncController.enviarAudioPorFecha);

// Exportar el enrutador
export default syncRouter;
