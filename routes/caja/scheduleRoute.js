import { Router } from 'express';
import * as scheduleController from '../../controllers/caja/scheduleController.js'

const scheduleRouter = Router();

// Rutas para los horarios de sincronización
scheduleRouter.get('/schedules', scheduleController.obtenerHorarios);
scheduleRouter.get('/schedules/:id', scheduleController.obtenerHorarioPorId);
scheduleRouter.post('/schedules', scheduleController.crearHorario);
scheduleRouter.put('/schedules/:id', scheduleController.actualizarHorario);
scheduleRouter.delete('/schedules/:id', scheduleController.eliminarHorario);

export default scheduleRouter;
