import express from 'express';
import { Router } from 'express';
import multer from 'multer'; // Middleware para manejar archivos
import * as productosController from '../../controllers/gmedias/productosController.js';
import { authenticate } from '../../middleware/authMiddleware.js';

// const router = express.Router();
const productosRouter = Router()

// Configuración de multer para manejar la carga de archivos
const upload = multer({ dest: 'uploads/' });

// Rutas para productos
productosRouter.get('/productos', productosController.obtenerProductos);
productosRouter.post('/productos/fecha', productosController.obtenerProductosPorFecha);
productosRouter.get("/productos/:barcode/barra", productosController.obtenerProductoCodigoBarra);
productosRouter.get("/productos/:nummedia/numeromedia", productosController.obtenerProductoNumMedia);
productosRouter.get("/productos/:barcode/productosbarra", productosController.obtenerProductosCodigoBarra);
productosRouter.get('/productos/:productoId', productosController.obtenerProductoPorId);
productosRouter.get("/productos/filteredProducts/:branchId/:startDate?/:endDate?", productosController.obtenerProductosFiltradosSucursalFecha);
productosRouter.post('/productos', productosController.crearProducto);
productosRouter.put('/productos/:productoId', productosController.actualizarProducto);
productosRouter.delete('/productos/:productoId', productosController.eliminarProducto);
productosRouter.post('/productos/generarcodigos', productosController.generarCodigos);

// Ruta para subir un archivo Excel y actualizar productos
productosRouter.post('/productos/upload', upload.single('file'), productosController.procesarDesdeExcel);

export default productosRouter;

