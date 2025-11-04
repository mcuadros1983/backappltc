// routes/sueldoempleado/liquidacionRoute.js
import { Router } from "express";
import * as controller from "../../controllers/sueldoempleado/liquidacionController.js";

const liquidacionRouter = Router();

liquidacionRouter.post("/liquidacion/:periodo_id/calcular", controller.liquidarPeriodo);
liquidacionRouter.put("/liquidacion/recibo/:id/confirmar", controller.confirmarRecibo);
liquidacionRouter.get("/liquidacion/recibo/:id/detalle", controller.obtenerReciboDetalle);
liquidacionRouter.get("/liquidacion/recibo", controller.listarRecibos);
liquidacionRouter.get("/liquidacion/recibostotales", controller.listarRecibosTotales);
liquidacionRouter.get("/liquidacion/recibo/:id", controller.obtenerRecibo);
liquidacionRouter.post("/liquidacion/recibo", controller.crearRecibo);
liquidacionRouter.put("/liquidacion/recibo/:id", controller.actualizarRecibo);
liquidacionRouter.delete("/liquidacion/recibo/:id", controller.eliminarRecibo); // opcional



export default liquidacionRouter;
