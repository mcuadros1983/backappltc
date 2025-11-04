import { Router } from "express";
import * as controller from "../../controllers/tablas/datosEmpleadoController.js";

const datosEmpleadoRouter = Router();

// Estilo nested por empleado (idempotente con upsert)
datosEmpleadoRouter.post("/empleados/:empleado_id/datos", controller.upsertPorEmpleado);
datosEmpleadoRouter.put("/empleados/:empleado_id/datos", controller.upsertPorEmpleado);
datosEmpleadoRouter.get("/empleados/:empleado_id/datos", controller.obtenerPorEmpleado);
datosEmpleadoRouter.delete("/empleados/:empleado_id/datos", controller.eliminarPorEmpleado);

// Listado general por filtros (opcional)
datosEmpleadoRouter.get("/datosempleado", controller.listar);

export default datosEmpleadoRouter; 
