// server/routes/proyeccionRoute.js
import { Router } from "express";
import { proyeccionCalculoController } from "../../controllers/proyeccion/proyeccionCalculoController.js";
import { proyeccionHistoricoController } from "../../controllers/proyeccion/proyeccionHistoricoController.js";
import { proyeccionResumenController } from "../../controllers/proyeccion/proyeccionResumenController.js";


const proyeccionRouter = Router();

// Calcula proyección final lista para mostrar
proyeccionRouter.post("/proyeccion/calcular", proyeccionCalculoController.calcularProyeccion);
// consultar histórico persistido
// filtros opcionales via querystring:
//   ?sucursalId=1&fechaDesde=2025-11-01&fechaHasta=2025-11-30
//   ?lote_calculo_id=1730130456712
proyeccionRouter.get("/proyeccion/historico", proyeccionHistoricoController.listar);

proyeccionRouter.get("/proyeccion/resumen", proyeccionResumenController.resumen);

export default proyeccionRouter;
