// routes/conciliacion/criterioRoute.js
import { Router } from "express";
import * as criterioController from "../../controllers/conciliacion/criterioController.js";

const criterioRouter = Router();

criterioRouter.post("/conciliacion-criterios", criterioController.crearCriterio);
criterioRouter.get("/conciliacion-criterios", criterioController.listarCriterios);
criterioRouter.get("/conciliacion-criterios/:id", criterioController.obtenerCriterioPorId);
criterioRouter.put("/conciliacion-criterios/:id", criterioController.actualizarCriterio);
criterioRouter.delete("/conciliacion-criterios/:id", criterioController.eliminarCriterio);

export default criterioRouter;
