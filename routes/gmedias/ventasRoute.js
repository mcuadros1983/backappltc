import express from 'express';
import { Router } from "express";
import * as ventasController from '../../controllers/gmedias/ventasController.js';
import { authenticate } from '../../middleware/authMiddleware.js'; 

// const router = express.Router();
const ventasRouter = Router()

// Rutas para ventas
ventasRouter.get('/ventas', ventasController.obtenerVentas);
ventasRouter.get('/ventas/:ventaId', ventasController.obtenerVentaPorId); 
ventasRouter.post('/ventas', ventasController.crearVenta); 
ventasRouter.get('/ventas/:id/productos', ventasController.obtenerProductosVenta);  
ventasRouter.delete('/ventas/:ventaId', ventasController.eliminarVenta);
ventasRouter.put('/ventas/:ventaId', ventasController.actualizarVenta);
// Nueva ruta para actualizar un producto en una venta
ventasRouter.put('/ventas/:ventaId/productos/:productoId', ventasController.actualizarProductoEnVenta);
ventasRouter.post('/ventas/producto', ventasController.eliminarProductoVenta); 
ventasRouter.get('/ventas/:ventaId/fecha-creacion', ventasController.fetchSaleCreatedAt);

export default ventasRouter; 