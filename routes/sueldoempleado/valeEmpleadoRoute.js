import { Router } from "express";
import * as controller from "../../controllers/sueldoempleado/valeEmpleadoController.js";

const valeEmpleadoRouter = Router();

valeEmpleadoRouter.post("/valesempleado", controller.crearValeEmpleado);
valeEmpleadoRouter.get("/valesempleado", controller.listarValesEmpleado);
valeEmpleadoRouter.get("/valesempleado/:id", controller.obtenerValeEmpleadoPorId);
valeEmpleadoRouter.put("/valesempleado/:id", controller.actualizarValeEmpleado);
valeEmpleadoRouter.delete("/valesempleado/:id", controller.eliminarValeEmpleado);

export default valeEmpleadoRouter;
