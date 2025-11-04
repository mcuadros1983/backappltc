import { Router } from "express";
import * as controller from "../../controllers/asistencia/horarioTurnoController.js";

const horarioTurnoRouter = Router();

horarioTurnoRouter.post("/horarioturno", controller.crearHorarioTurno);
horarioTurnoRouter.get("/horarioturno", controller.listarHorariosTurno);
horarioTurnoRouter.get("/horarioturno/:id", controller.obtenerHorarioTurnoPorId);
horarioTurnoRouter.put("/horarioturno/:id", controller.actualizarHorarioTurno);
horarioTurnoRouter.delete("/horarioturno/:id", controller.eliminarHorarioTurno);

export default horarioTurnoRouter;
