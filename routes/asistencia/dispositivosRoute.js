import { Router } from 'express';
import * as c from '../../controllers/asistencia/dispositivosController.js';
const dispositivoRouter = Router();
dispositivoRouter.get('/dispositivos', c.list);
dispositivoRouter.get('/dispositivos/:id', c.getById);
dispositivoRouter.post('/dispositivos', c.create);
dispositivoRouter.put('/dispositivos/:id', c.update);
dispositivoRouter.delete('/dispositivos/:id', c.remove);
export default dispositivoRouter;
