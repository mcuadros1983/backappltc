import { Router } from "express";
import * as controller from "../../controllers/sueldoempleado/descuentoSueldoController.js";

const descuentoSueldoRouter = Router();

descuentoSueldoRouter.post("/descuentossueldo", controller.crearDescuentoSueldo);
descuentoSueldoRouter.get("/descuentossueldo", controller.listarDescuentosSueldo);
descuentoSueldoRouter.get("/descuentossueldo/:id", controller.obtenerDescuentoSueldoPorId);
descuentoSueldoRouter.put("/descuentossueldo/:id", controller.actualizarDescuentoSueldo);
descuentoSueldoRouter.delete("/descuentossueldo/:id", controller.eliminarDescuentoSueldo);

export default descuentoSueldoRouter;
