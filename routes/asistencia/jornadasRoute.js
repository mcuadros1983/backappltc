// routes/asistencia/jornadasRoute.js
import { Router } from 'express';
import * as c from '../../controllers/asistencia/jornadasController.js';

const jornadasRouter = Router();

jornadasRouter.get('/jornadas', c.list);
jornadasRouter.get('/jornadas/:id', c.getById);
jornadasRouter.post('/jornadas', c.create);
jornadasRouter.put('/jornadas/:id', c.update);
jornadasRouter.delete('/jornadas/:id', c.remove);

// Gestión de turnos dentro de una jornada
jornadasRouter.get('/jornadas/:id/turnos', c.listTurnos);
jornadasRouter.post('/jornadas/:id/turnos', c.addTurno);
jornadasRouter.delete('/jornadas/:id/turnos/:turnoId', c.removeTurno);

export default jornadasRouter;
