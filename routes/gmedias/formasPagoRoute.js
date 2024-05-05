import express from 'express';
import { Router } from 'express';
import * as formasPagoController from '../../controllers/gmedias/formasPagoController.js';
import { authenticate } from '../../middleware/authMiddleware.js'; 

// const router = express.Router();
const formasPagoRouter = Router()

// Rutas para formas de pago
formasPagoRouter.get('/formas-pago', formasPagoController.obtenerFormasPago);
formasPagoRouter.get('/formas-pago/:formaPagoId', formasPagoController.obtenerFormaPagoPorId);
formasPagoRouter.post('/formas-pago', formasPagoController.crearFormaPago);
formasPagoRouter.put('/formas-pago/:formaPagoId', formasPagoController.actualizarFormaPago);
formasPagoRouter.delete('/formas-pago/:formaPagoId', formasPagoController.eliminarFormaPago); 

export default formasPagoRouter;