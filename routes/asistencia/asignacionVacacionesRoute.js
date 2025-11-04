import { Router } from "express";
import * as controller from "../../controllers/asistencia/asignacionVacacionesController.js";

const asignacionVacacionesRouter = Router();

asignacionVacacionesRouter.post("/asignacionesvacaciones", controller.crearAsignacionVacaciones);
asignacionVacacionesRouter.get("/asignacionesvacaciones", controller.listarAsignacionesVacaciones);
asignacionVacacionesRouter.get("/asignacionesvacaciones/:id", controller.obtenerAsignacionVacacionesPorId);
asignacionVacacionesRouter.put("/asignacionesvacaciones/:id", controller.actualizarAsignacionVacaciones);
asignacionVacacionesRouter.delete("/asignacionesvacaciones/:id", controller.eliminarAsignacionVacaciones);

// 🔹 nuevas rutas equivalentes a Django:
asignacionVacacionesRouter.get("/asignacionesvacaciones/status/:empleado_id/:periodo", controller.getVacationStatus);
asignacionVacacionesRouter.get("/asignacionesvacaciones/interval/:start_date/:end_date", controller.getVacationsInInterval);
asignacionVacacionesRouter.get("/asignacionesvacaciones/interval/:start_date/:end_date/:sucursal_id", controller.getVacationsInInterval);
asignacionVacacionesRouter.get("/asignacionesvacaciones/employee/:empleado_id", controller.getEmployeeVacations);

export default asignacionVacacionesRouter;
