// routes/sueldoempleado/periodoLiquidacionRoute.js
import { Router } from "express";
import * as controller from "../../controllers/sueldoempleado/periodoLiquidacionController.js";

const periodoLiquidacionRouter = Router();

periodoLiquidacionRouter.get("/periodoliquidacion", controller.listarPeriodos);
periodoLiquidacionRouter.post("/periodoliquidacion", controller.crearPeriodo);
periodoLiquidacionRouter.put("/periodoliquidacion/:id/cerrar", controller.cerrarPeriodo);

export default periodoLiquidacionRouter;
