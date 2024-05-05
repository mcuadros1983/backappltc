import express from 'express';
import { Router } from 'express';
import * as cobranzasController from '../../controllers/gmedias/cobranzasController.js';
import { authenticate } from '../../middleware/authMiddleware.js';

// const router = express.Router();
const cobranzasRouter = Router()

// Rutas para cobranzas
cobranzasRouter.get('/cobranzas', cobranzasController.obtenerCobranzas);
cobranzasRouter.get('/cobranzas/:cobranzaId', cobranzasController.obtenerCobranzaPorId);
cobranzasRouter.post('/cobranzas', cobranzasController.registrarCobranza);
cobranzasRouter.put('/cobranzas/:cobranzaId', cobranzasController.actualizarCobranza);
cobranzasRouter.delete('/cobranzas/:cobranzaId', cobranzasController.eliminarCobranza);

export default cobranzasRouter;