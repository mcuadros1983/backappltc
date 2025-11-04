// routes/finanzas/gastoEstimadoReportesRoute.js
import { Router } from "express";
import {
  obligacionesMesAgrupado,
  vencenEn,
  estadoResumen,
  pagadasVsPendientes,
} from "../../controllers/tesoreria/gastoEstimadoReportesController.js";

const gastoEstimadoReportesRouter = Router();

// 1) Obligaciones del mes agrupadas
//   GET /gastos-estimados/reportes/obligaciones-mes?empresa_id=&anio=&mes=&group_by=proveedor
gastoEstimadoReportesRouter.get("/gastos-estimados/reportes/obligaciones-mes", obligacionesMesAgrupado);

// 2) Vencen en X días
//   GET /gastos-estimados/reportes/vencen-en?empresa_id=&dias=7
//   (soporta también desde/hasta explícito)
gastoEstimadoReportesRouter.get("/gastos-estimados/reportes/vencen-en", vencenEn);

// 3) Resumen por estado
//   GET /gastos-estimados/reportes/estado-resumen?empresa_id=&desde=&hasta=
gastoEstimadoReportesRouter.get("/gastos-estimados/reportes/estado-resumen", estadoResumen);

// 4) Pagadas vs. Pendientes
//   GET /gastos-estimados/reportes/pagadas-vs-pendientes?empresa_id=&desde=&hasta=
gastoEstimadoReportesRouter.get("/gastos-estimados/reportes/pagadas-vs-pendientes", pagadasVsPendientes);

export default gastoEstimadoReportesRouter;
