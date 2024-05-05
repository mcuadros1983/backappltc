import express from 'express';
import { Router } from 'express';
import * as cuentasCorrientesController from '../../controllers/gmedias/cuentasCorrientesController.js';
import { authenticate } from '../../middleware/authMiddleware.js';

// const router = express.Router();
const cuentasCorrientesRouter = Router()

// Rutas para cuentas corrientes
cuentasCorrientesRouter.get('/cuentas-corrientes', cuentasCorrientesController.obtenerCuentasCorrientes); 
cuentasCorrientesRouter.get('/cuentas-corrientes/:cuentaCorrienteId', cuentasCorrientesController.obtenerCuentaCorrientePorId);
cuentasCorrientesRouter.post('/cuentas-corrientes', cuentasCorrientesController.crearCuentaCorriente);
cuentasCorrientesRouter.put('/cuentas-corrientes/:cuentaCorrienteId', cuentasCorrientesController.actualizarCuentaCorrienteIdCliente);
cuentasCorrientesRouter.delete('/cuentas-corrientes/:cuentaCorrienteId', cuentasCorrientesController.eliminarCuentaCorriente);
cuentasCorrientesRouter.get('/cuentas-corrientes/:clienteId/operaciones', cuentasCorrientesController.obtenerOperacionesCuentaCorriente);

export default cuentasCorrientesRouter;