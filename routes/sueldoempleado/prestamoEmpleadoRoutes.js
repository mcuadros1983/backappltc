import { Router } from "express";

import * as controller
  from "../../controllers/sueldoempleado/prestamoEmpleadoController.js";

const prestamoEmpleadoRouter = Router();

prestamoEmpleadoRouter.post(
  "/prestamosempleado",
  controller.crear
);

prestamoEmpleadoRouter.get(
  "/prestamosempleado",
  controller.listar
);

prestamoEmpleadoRouter.get(
  "/prestamosempleado/:id",
  controller.obtener
);

prestamoEmpleadoRouter.put(
  "/prestamosempleado/:id",
  controller.actualizar
);

prestamoEmpleadoRouter.put(
  "/prestamosempleado/:id/anular",
  controller.anular
);

prestamoEmpleadoRouter.post(
  "/prestamosempleado/:id/recalcular",
  controller.recalcular
);

prestamoEmpleadoRouter.get(
  "/empleados/:empleado_id/prestamos",
  controller.listarPorEmpleado
);

export default prestamoEmpleadoRouter;