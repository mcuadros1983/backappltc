// src/routes/parametrosRoute.js
import { Router } from 'express';
import * as c from '../../controllers/asistencia/parametrosController.js';
const parametrosRouter = Router();
parametrosRouter.get('/parametros', c.getAll);
parametrosRouter.put('/parametros', c.upsertMany);
export default parametrosRouter;
