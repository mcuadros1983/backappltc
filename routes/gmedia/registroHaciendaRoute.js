// server/routes/gmedia/registroHaciendaRoute.js
import { Router } from "express";
import * as controller from "../../controllers/gmedia/registroHaciendaController.js";

const registroHaciendaRouter = Router();

registroHaciendaRouter.post("/registrohacienda", controller.crearRegistroHacienda);
registroHaciendaRouter.get("/registrohacienda", controller.listarRegistroHacienda);
registroHaciendaRouter.get("/registrohacienda/:id", controller.obtenerRegistroHaciendaPorId);
registroHaciendaRouter.put("/registrohacienda/:id", controller.actualizarRegistroHacienda);

// NO hay anular/restaurar específicos en el controller actual.
// El DELETE realiza soft delete (anula el ítem y recalcula el header).
registroHaciendaRouter.delete("/registrohacienda/:id", controller.eliminarRegistroHacienda);

export default registroHaciendaRouter;
