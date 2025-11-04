import { Router } from "express";
import * as controller from "../../controllers/sueldoempleado/sueldoEmpleadoController.js";

const sueldoEmpleadoRouter = Router();

sueldoEmpleadoRouter.post("/sueldosempleado", controller.crearSueldoEmpleado);
sueldoEmpleadoRouter.get("/sueldosempleado", controller.listarSueldosEmpleado);
sueldoEmpleadoRouter.get("/sueldosempleado/:id", controller.obtenerSueldoEmpleadoPorId);
sueldoEmpleadoRouter.put("/sueldosempleado/:id", controller.actualizarSueldoEmpleado);
sueldoEmpleadoRouter.delete("/sueldosempleado/:id", controller.eliminarSueldoEmpleado);

export default sueldoEmpleadoRouter;
