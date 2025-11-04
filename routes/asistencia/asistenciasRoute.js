// src/routes/asistenciasRoute.js
import { Router } from 'express';
import * as c from '../../controllers/asistencia/asistenciasController.js';
const asistenciaRouter = Router();
asistenciaRouter.get('/asistencias', c.list);
asistenciaRouter.get('/asistencias/detallado', c.listDetallado); // 👈 NUEVO
asistenciaRouter.post('/asistencias', c.createAsistencia); 
export default asistenciaRouter;
