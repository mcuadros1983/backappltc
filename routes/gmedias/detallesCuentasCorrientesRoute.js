import express from 'express';
import { Router } from 'express';
import * as detallesCuentasCorrientesController from '../../controllers/gmedias/detallesCuentasCorrientesController.js';
import { authenticate } from '../../middleware/authMiddleware.js';

// const router = express.Router();
const detallesCuentasCorrientesRouter = Router()

// Rutas para detalles de cuentas corrientes
detallesCuentasCorrientesRouter.get('/detalles-cuentas-corrientes', detallesCuentasCorrientesController.obtenerDetallesCuentasCorrientes);
detallesCuentasCorrientesRouter.get('/detalles-cuentas-corrientes/:detalleCuentaCorrienteId', detallesCuentasCorrientesController.obtenerDetalleCuentaCorrientePorId);
detallesCuentasCorrientesRouter.post('/detalles-cuentas-corrientes', detallesCuentasCorrientesController.crearDetalleCuentaCorriente);
detallesCuentasCorrientesRouter.put('/detalles-cuentas-corrientes/:detalleCuentaCorrienteId', detallesCuentasCorrientesController.actualizarDetalleCuentaCorriente);
detallesCuentasCorrientesRouter.delete('/detalles-cuentas-corrientes/:detalleCuentaCorrienteId', detallesCuentasCorrientesController.eliminarDetalleCuentaCorriente);

export default detallesCuentasCorrientesRouter;