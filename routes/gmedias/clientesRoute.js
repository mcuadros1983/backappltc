import express from 'express';
import { Router } from 'express';
import * as clientesController from '../../controllers/gmedias/clientesController.js';
import { authenticate } from '../../middleware/authMiddleware.js';

// const router = express.Router();
const clientesRouter = Router()

// Rutas para clientes
clientesRouter.get('/clientes/', clientesController.obtenerClientes);
clientesRouter.get('/clientes/:clienteId/', clientesController.obtenerClientePorId);
clientesRouter.post('/clientes-new/', clientesController.crearCliente);
clientesRouter.put('/clientes/:clienteId/', clientesController.actualizarCliente);
clientesRouter.delete('/clientes/:clienteId/', clientesController.eliminarCliente);

// Rutas adicionales para obtener información relacionada
clientesRouter.get('/clientes/:clienteId/ventas/', clientesController.obtenerVentasDeCliente);
clientesRouter.get('/clientes/:clienteId/cuenta-corriente/', clientesController.obtenerCuentaCorrienteDeCliente);

export default clientesRouter;