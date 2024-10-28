import { Router } from 'express';
import * as messageController from '../../controllers/caja/mensajeController.js'

const messageRouter = Router();

// Rutas para los mensajes
messageRouter.get('/messages', messageController.obtenerMensajes);
messageRouter.get('/messages/:id', messageController.obtenerMensajePorId);
messageRouter.post('/messages', messageController.crearMensaje);
messageRouter.put('/messages/:id', messageController.actualizarMensaje);
messageRouter.delete('/messages/:id', messageController.eliminarMensaje);

export default messageRouter;
