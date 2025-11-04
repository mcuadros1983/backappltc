import { Router } from "express";
import * as controller from "../../controllers/asistencia/eventoController.js";

const eventoRouter = Router();

eventoRouter.post("/eventos", controller.crearEvento);
eventoRouter.get("/eventos", controller.listarEventos);
eventoRouter.get("/eventos/:id", controller.obtenerEventoPorId);
eventoRouter.put("/eventos/:id", controller.actualizarEvento);
eventoRouter.delete("/eventos/:id", controller.eliminarEvento);

export default eventoRouter;
