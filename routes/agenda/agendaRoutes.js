

// server/routes/gmedia/haciendaRoute.js
import { Router } from "express";
import * as controller from "../../controllers/agenda/agendaController.js";
// import JWTAuth from "../../middleware/jwtMiddleware.js";
// import { attachPermissions } from "../../middleware/attachPermissions.js";
// import { authorize } from "../../middleware/authorize.js";


const agendaRouter = Router();

// 🔐 Primero exigir autenticación y adjuntar permisos
// agendaRouter.use(JWTAuth, attachPermissions);

/**
 * Sugerencia de permisos:
 * - agenda.create         → crear items
 * - agenda.view           → listar / ver detalle
 * - agenda.view.upcoming  → ver "próximos vencimientos"
 * - agenda.update         → actualizar item
 * - agenda.state.change   → cambiar estado
 * - agenda.postpone       → postergar
 * - agenda.delete         → eliminar (soft)
 * - agenda.delete.hard    → eliminar definitivo (hard)
 */

// CRUD + extras con permisos
agendaRouter.post(
  "/agenda",
  // authorize("agenda.create"),
  controller.crearAgenda
);

agendaRouter.get(
  "/agenda",
  // authorize("agenda.view"),
  controller.listarAgenda
);

agendaRouter.get(
  "/agenda/proximos",
  // authorize("agenda.view.upcoming"),
  controller.proximosVencimientos
);

agendaRouter.get(
  "/agenda/:id",
  // authorize("agenda.view"),
  controller.obtenerAgenda
);

agendaRouter.put(
  "/agenda/:id",
  // authorize("agenda.update"),
  controller.actualizarAgenda
);

agendaRouter.patch(
  "/agenda/:id/estado",
  // authorize("agenda.state.change"),
  controller.cambiarEstadoAgenda
);

agendaRouter.post(
  "/agenda/:id/postergar",
  // authorize("agenda.postpone"),
  controller.postergarAgenda
);

agendaRouter.delete(
  "/agenda/:id",
  // authorize("agenda.delete"),
  controller.eliminarAgenda
);

agendaRouter.delete(
  "/agenda/:id/hard",
  // authorize("agenda.delete.hard"),
  controller.eliminarAgendaHard
);

export default agendaRouter;