import { Router } from 'express';
import multer from 'multer';
import * as productosController from '../../controllers/gmedias/productosController.js';
import { authenticate } from '../../middleware/authMiddleware.js';

const productosRouter = Router();

// Configuración de multer para manejar la carga de archivos
const upload = multer({ dest: 'uploads/' });

/**
 * 1. Rutas SIN parámetros ambiguos o con prefijos largos específicos
 *    (van primero para que no se las "robe" /productos/:loquesea)
 */

// Obtener todos los productos
productosRouter.get('/productos', productosController.obtenerProductos);

// Productos por fecha
productosRouter.post('/productos/fecha', productosController.obtenerProductosPorFecha);

// Productos filtrados por sucursal y fechas
productosRouter.get(
  "/productos/filteredProducts/:branchId/:startDate?/:endDate?",
  productosController.obtenerProductosFiltradosSucursalFecha
);

// Generar códigos
productosRouter.post(
  '/productos/generarcodigos',
  productosController.generarCodigos
);

// Tropas por categoría (IMPORTANTE: antes que cualquier :param)
productosRouter.get(
  '/productos/tropas',
  productosController.obtenerTropasPorCategoria
);

// Tropas por categoría (IMPORTANTE: antes que cualquier :param)
productosRouter.get(
  'productos/num_media/porcino',
  productosController.obtenerNumMediaPorcino
);


// Subir Excel y procesar
productosRouter.post(
  '/productos/upload',
  upload.single('file'),
  productosController.procesarDesdeExcel
);

// Actualizar en masa por tropa
productosRouter.post(
  '/productos/actualizar-por-tropa',
  productosController.actualizarProductosPorTropa
);

/**
 * 2. Rutas con patrones más específicos de 2 segmentos tipo
 *    /productos/:barcode/barra
 *    /productos/:nummedia/numeromedia
 *    /productos/:barcode/productosbarra
 *    Estas son más específicas que /productos/:productoId porque tienen
 *    un segundo segmento fijo (barra / numeromedia / productosbarra).
 *    Las ponemos ANTES que /productos/:productoId.
 */

productosRouter.get(
  "/productos/:barcode/barra",
  productosController.obtenerProductoCodigoBarra
);

productosRouter.get(
  "/productos/:nummedia/numeromedia",
  productosController.obtenerProductoNumMedia
);

productosRouter.get(
  "/productos/:barcode/productosbarra",
  productosController.obtenerProductosCodigoBarra
);

/**
 * 3. Rutas genéricas al final
 *    Estas se van a comer TODO lo que no matcheó arriba,
 *    por eso TIENEN QUE IR ÚLTIMAS.
 */

// Crear producto nuevo
productosRouter.post(
  '/productos',
  productosController.crearProducto
);

// Obtener producto por ID
productosRouter.get(
  '/productos/:productoId',
  productosController.obtenerProductoPorId
);

// Actualizar producto por ID
productosRouter.put(
  '/productos/:productoId',
  productosController.actualizarProducto
);

// Eliminar producto por ID
productosRouter.delete(
  '/productos/:productoId',
  productosController.eliminarProducto
);

export default productosRouter;
