import { Router } from 'express';
import * as c from '../../controllers/asistencia/turnosController.js';
const turnosRouter = Router();
turnosRouter.get('/turnos', c.list);
turnosRouter.get('/turnos/:id', c.getById);
turnosRouter.post('/turnos', c.create);
turnosRouter.put('/turnos/:id', c.update);
turnosRouter.delete('/turnos/:id', c.remove);
export default turnosRouter;
