import { Router } from "express";
import * as controller from "../../controllers/tesoreria/tarjetaPlanPagoController.js";

const tarjetaPlanPagoRouter = Router();

tarjetaPlanPagoRouter.post("/tarjeta-planes", controller.crearTarjetaPlanPago);
tarjetaPlanPagoRouter.get("/tarjeta-planes", controller.listarTarjetaPlanesPago);
tarjetaPlanPagoRouter.get("/tarjeta-planes/:id", controller.obtenerTarjetaPlanPagoPorId);
tarjetaPlanPagoRouter.put("/tarjeta-planes/:id", controller.actualizarTarjetaPlanPago);
tarjetaPlanPagoRouter.delete("/tarjeta-planes/:id", controller.eliminarTarjetaPlanPago);

export default tarjetaPlanPagoRouter;
