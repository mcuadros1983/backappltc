// src/routes/telefonoEmpleado.routes.js
import { Router } from "express";
import * as telefonoEmpleadoController from "../../controllers/tablas/telefonoEmpleadoController.js";

const telefonoEmpleadoRouter = Router();

/**
 * Rutas base CRUD
 */
telefonoEmpleadoRouter.get("/telefonos", telefonoEmpleadoController.listTelefonos);
telefonoEmpleadoRouter.get("/telefonos/:id", telefonoEmpleadoController.getTelefono);
telefonoEmpleadoRouter.post("/telefonos", telefonoEmpleadoController.createTelefono);
telefonoEmpleadoRouter.put("/telefonos/:id", telefonoEmpleadoController.updateTelefono);
telefonoEmpleadoRouter.delete("/telefonos/:id", telefonoEmpleadoController.deleteTelefono);

/**
 * Rutas “anidadas” por empleado (atajos)
 */
telefonoEmpleadoRouter.get("/empleados/:empleado_id/telefonos", telefonoEmpleadoController.listTelefonosPorEmpleado);
telefonoEmpleadoRouter.post("/empleados/:empleado_id/telefonos", telefonoEmpleadoController.createTelefonoParaEmpleado);

export default telefonoEmpleadoRouter;
