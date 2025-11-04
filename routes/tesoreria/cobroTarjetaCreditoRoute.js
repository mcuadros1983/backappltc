import { Router } from "express";
import * as controller from "../../controllers/tesoreria/cobroTarjetaCreditoController.js";

const cobroTarjetaCreditoRouter = Router();

cobroTarjetaCreditoRouter.post("/cobros-tarjeta-credito", controller.crearCobroTarjetaCredito);
cobroTarjetaCreditoRouter.get("/cobros-tarjeta-credito", controller.listarCobrosTarjetaCredito);
cobroTarjetaCreditoRouter.get("/cobros-tarjeta-credito/:id", controller.obtenerCobroTarjetaCreditoPorId);
cobroTarjetaCreditoRouter.put("/cobros-tarjeta-credito/:id", controller.actualizarCobroTarjetaCredito);
cobroTarjetaCreditoRouter.delete("/cobros-tarjeta-credito/:id", controller.eliminarCobroTarjetaCredito);

export default cobroTarjetaCreditoRouter;
