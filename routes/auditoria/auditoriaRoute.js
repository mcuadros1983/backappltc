
// server/routes/gmedia/haciendaRoute.js
import { Router } from "express";
import * as controller from "../../controllers/auditoria/auditoriaController.js";

const auditoriaRouter = Router();


// Listado con filtros y paginación
auditoriaRouter.get("/auditoria", controller.listarAuditLogs);

// Detalle por id
auditoriaRouter.get("/auditoria/:id", controller.obtenerAuditLogPorId);

// ⬇️ nueva
auditoriaRouter.post("/auditoria/purge", controller.purgarAuditLogs);

export default auditoriaRouter;
