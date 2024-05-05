import express from 'express';
import { Router } from 'express';
import * as ordenesController from '../../controllers/gmedias/ordenesController.js';
import { authenticate } from '../../middleware/authMiddleware.js';

// const router = express.Router();
const ordenesRouter = Router()

// Rutas para ordenes
ordenesRouter.get('/ordenes', ordenesController.obtenerOrdenes);
ordenesRouter.post('/ordenesfiltradas', ordenesController.obtenerOrdenesFiltradas);
ordenesRouter.get('/ordenes/:id', ordenesController.obtenerOrden);
ordenesRouter.post('/ordenes', ordenesController.crearOrden); 
ordenesRouter.get('/ordenes/:id/productos', ordenesController.obenerProductosOrden);
ordenesRouter.put('/ordenes/:id', ordenesController.actualizarOrden);
ordenesRouter.delete('/ordenes/:id', ordenesController.eliminarOrden);
ordenesRouter.post('/ordenes/producto', ordenesController.eliminarProductoOrden);
ordenesRouter.get('/ordenes/:ordenId/fecha-creacion', ordenesController.fetchOrderCreatedAt);

export default ordenesRouter;