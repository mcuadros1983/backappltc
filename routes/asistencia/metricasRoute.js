// src/routes/metricasRoute.js
import { Router } from 'express';
import * as c from '../../controllers/asistencia/metricasController.js';
const metricasRouter = Router();
metricasRouter.get('/metricas/resumen', c.resumen);
export default metricasRouter;
