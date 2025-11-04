import { Router } from "express";
import * as controller from "../../controllers/tesoreria/ingresoCajaController.js";

const ingresoCajaRouter = Router();

ingresoCajaRouter.post("/ingresos-caja", controller.crearIngresoCaja);
ingresoCajaRouter.get("/ingresos-caja", controller.listarIngresosCaja);
ingresoCajaRouter.get("/ingresos-caja/:id", controller.obtenerIngresoCajaPorId);
ingresoCajaRouter.put("/ingresos-caja/:id", controller.actualizarIngresoCaja);
ingresoCajaRouter.delete("/ingresos-caja/:id", controller.eliminarIngresoCaja);

export default ingresoCajaRouter;
