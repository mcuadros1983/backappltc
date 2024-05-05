import { Router } from 'express';
import * as sucursalesController from '../../controllers/gmedias/sucursalesController.js';

// const router = express.Router();
const sucursalesRouter = Router()

// Rutas para sucursales
sucursalesRouter.get('/sucursales', sucursalesController.obtenerSucursales);
sucursalesRouter.get('/sucursales/:id', sucursalesController.obtenerSucursal);
sucursalesRouter.get('/sucursales/:id/productos', sucursalesController.obtenerProductosSucursal);
sucursalesRouter.post('/sucursales', sucursalesController.crearSucursal);
sucursalesRouter.put('/sucursales/:id', sucursalesController.actualizarSucursal);
sucursalesRouter.delete('/sucursales/:id', sucursalesController.eliminarSucursal);

// export default router;
export default sucursalesRouter;