// routes/sueldoempleado/adelantoEmpleadoRoute.js
import { Router } from "express";
import * as controller from "../../controllers/sueldoempleado/adelantoEmpleadoController.js";

const adelantoEmpleadoRouter = Router();

// CRUD
adelantoEmpleadoRouter.post("/adelantosempleado", controller.crearAdelantoEmpleado);
adelantoEmpleadoRouter.get("/adelantosempleado", controller.listarAdelantosEmpleado);
adelantoEmpleadoRouter.get("/adelantosempleado/:id", controller.obtenerAdelantoEmpleadoPorId);
adelantoEmpleadoRouter.put("/adelantosempleado/:id", controller.actualizarAdelantoEmpleado);
adelantoEmpleadoRouter.delete("/adelantosempleado/:id", controller.eliminarAdelantoEmpleado);

// Negocio
adelantoEmpleadoRouter.post("/adelantosempleado/pagar", controller.registrarAdelantoEmpleado);
adelantoEmpleadoRouter.put("/adelantosempleado/:id/anular", controller.anularAdelantoEmpleado);

export default adelantoEmpleadoRouter;
