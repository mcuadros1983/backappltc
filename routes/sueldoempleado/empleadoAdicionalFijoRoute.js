// routes/sueldoempleado/empleadoAdicionalFijoRoute.js
import { Router } from "express";
import * as controller from "../../controllers/sueldoempleado/empleadoAdicionalFijoController.js";

const empleadoAdicionalFijoRouter = Router();

empleadoAdicionalFijoRouter.get("/empleadoadicionalfijo", controller.listarFijosEmpleado);
empleadoAdicionalFijoRouter.get("/empleadoadicionalfijo/vigentes", controller.fijosVigentesEmpleado);
empleadoAdicionalFijoRouter.post("/empleadoadicionalfijo", controller.asignarFijoEmpleado);
empleadoAdicionalFijoRouter.put("/empleadoadicionalfijo/:id/cerrar", controller.cerrarFijoEmpleado);

export default empleadoAdicionalFijoRouter;
