import express from 'express';
import { Router } from 'express';
import * as ingresosController from '../../controllers/gmedias/ingresosController.js';
import { authenticate } from '../../middleware/authMiddleware.js';

// const router = express.Router();
const ingresosRouter = Router()

// Rutas para ingresos  
ingresosRouter.get('/ingresos', ingresosController.obtenerIngresos);
ingresosRouter.get('/ingresos/:id', ingresosController.obtenerIngreso);
ingresosRouter.post('/ingresos', ingresosController.crearIngreso); 
ingresosRouter.get('/ingresos/:id/productos', ingresosController.obtenerProductosIngreso);
ingresosRouter.put('/ingresos/:id', ingresosController.actualizarIngreso);
ingresosRouter.delete('/ingresos/:id', ingresosController.eliminarIngreso);


export default ingresosRouter;