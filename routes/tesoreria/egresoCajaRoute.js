import { Router } from "express";
import * as controller from "../../controllers/tesoreria/egresoCajaController.js";

const egresoCajaRouter = Router();

egresoCajaRouter.post("/egresos-caja", controller.crearEgresoCaja);
egresoCajaRouter.get("/egresos-caja", controller.listarEgresosCaja);
egresoCajaRouter.get("/egresos-caja/:id", controller.obtenerEgresoCajaPorId);
egresoCajaRouter.put("/egresos-caja/:id", controller.actualizarEgresoCaja);
egresoCajaRouter.delete("/egresos-caja/:id", controller.eliminarEgresoCaja);

export default egresoCajaRouter;
