// routes/comun/proyectoRoute.js
import { Router } from "express";
import * as proyectoController from "../../controllers/comun/proyectoController.js";

const proyectoRouter = Router();

proyectoRouter.post("/proyectos", proyectoController.crearProyecto);
proyectoRouter.get("/proyectos", proyectoController.listarProyectos);
proyectoRouter.get("/proyectos/:id", proyectoController.obtenerProyectoPorId);
proyectoRouter.put("/proyectos/:id", proyectoController.actualizarProyecto);
proyectoRouter.delete("/proyectos/:id", proyectoController.eliminarProyecto);

export default proyectoRouter;
