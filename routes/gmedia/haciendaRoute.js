// server/routes/gmedia/haciendaRoute.js
import { Router } from "express";
import * as controller from "../../controllers/gmedia/haciendaController.js";

const haciendaRouter = Router();

haciendaRouter.post("/hacienda", controller.crearHacienda);
haciendaRouter.get("/hacienda", controller.listarHacienda);
// Headers disponibles (sin comprobante vinculado)
haciendaRouter.get("/hacienda/disponibles", controller.listarHaciendaDisponibles);

haciendaRouter.get("/hacienda/:id", controller.obtenerHaciendaPorId);
// Ítems activos de un header (para seleccionar uno)
haciendaRouter.get("/hacienda/:id/items-disponibles", controller.listarItemsDisponiblesPorHacienda);

haciendaRouter.put("/hacienda/:id", controller.actualizarHacienda);

// Soft delete / restore (usamos PUT como en tu estilo)
haciendaRouter.put("/hacienda/:id/anular", controller.anularHacienda);
haciendaRouter.put("/hacienda/:id/restaurar", controller.restaurarHacienda);

// Compatibilidad con DELETE (soft delete)
haciendaRouter.delete("/hacienda/:id", controller.eliminarHacienda);

export default haciendaRouter;
