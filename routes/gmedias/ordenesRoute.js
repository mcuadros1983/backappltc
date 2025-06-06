import express from 'express';
import { Router } from 'express';
import * as ordenesController from '../../controllers/gmedias/ordenesController.js';
import { authenticate } from '../../middleware/authMiddleware.js';
import multer from 'multer'; // Middleware para manejar archivos

// const router = express.Router();
const ordenesRouter = Router()

// Configuración de multer para manejar la carga de archivos
const upload = multer({ dest: 'uploads/' });


// Rutas para ordenes
ordenesRouter.get('/ordenes/productos', ordenesController.obtenerProductosOrden);
ordenesRouter.post('/sumacantidad', ordenesController.obtenerCantidadMediasBovino);
ordenesRouter.get('/ordenes', ordenesController.obtenerOrdenes);
ordenesRouter.post('/ordenesfiltradas', ordenesController.obtenerOrdenesFiltradas);
ordenesRouter.post('/productosordenesfiltradas', ordenesController.obtenerProductosFiltradosOrdenes);
ordenesRouter.get('/ordenes/:id', ordenesController.obtenerOrden);
ordenesRouter.post('/ordenes', ordenesController.crearOrden); 
ordenesRouter.get('/ordenes/:id/productos', ordenesController.obtenerProductosOrden);
ordenesRouter.put('/ordenes/:id', ordenesController.actualizarOrden);
ordenesRouter.delete('/ordenes/:id', ordenesController.eliminarOrden);
ordenesRouter.post('/ordenes/producto', ordenesController.eliminarProductoOrden);
ordenesRouter.get('/ordenes/:ordenId/fecha-creacion', ordenesController.fetchOrderCreatedAt);
ordenesRouter.post('/ordenes/costopromedio', ordenesController.obtenerCostoPromedio);
ordenesRouter.post('/ordenes/costovacuno_total', ordenesController.obtenerCostoVacunoTotal);
ordenesRouter.post('/ordenes/costoporcino_total', ordenesController.obtenerCostoPorcinoTotal);
ordenesRouter.post('/ordenes/cargar-productos-excel', upload.single('file'), ordenesController.crearOrdenesDesdeExcel);

export default ordenesRouter;