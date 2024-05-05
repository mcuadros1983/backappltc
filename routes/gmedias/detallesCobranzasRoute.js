import express from 'express';
import { Router } from 'express';
import * as detallesCobranzasController from '../../controllers/gmedias/detallesCobranzasController.js';
import { authenticate } from '../../middleware/authMiddleware.js';

// const router = express.Router();
const detallesCobranzasRouter = Router()

// Rutas para detalleCobranzas
detallesCobranzasRouter.get('/detalles-cobranzas', detallesCobranzasController.obtenerDetallesCobranzas);
detallesCobranzasRouter.get('/detalles-cobranzas/:detalleCobranzaId', detallesCobranzasController.obtenerDetalleCobranzaPorId);
detallesCobranzasRouter.post('/detalles-cobranzas', detallesCobranzasController.registrarDetalleCobranza);
detallesCobranzasRouter.put('/detalles-cobranzas/:detalleCobranzaId', detallesCobranzasController.actualizarDetalleCobranza);
detallesCobranzasRouter.delete('/detalles-cobranzas/:detalleCobranzaId', detallesCobranzasController.eliminarDetalleCobranza);

export default detallesCobranzasRouter;