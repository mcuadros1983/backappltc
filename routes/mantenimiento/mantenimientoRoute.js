// routes/equipoRoutes.js
import express from 'express';
import { Router } from 'express';
import * as mantenimientoController from '../../controllers/mantenimiento/mantenimientoController.js';
import JWTAuth from "../../middleware/jwtMiddleware.js";
import { attachPermissions } from "../../middleware/attachPermissions.js";
import { authorize } from "../../middleware/authorize.js"; // o authorize

const mantenimientoRouter = Router()

mantenimientoRouter.use(JWTAuth, attachPermissions); 
mantenimientoRouter.post('/mantenimientos',  authorize("mantenimiento:create"),mantenimientoController.crearMantenimiento);
mantenimientoRouter.get('/mantenimientos',  authorize("mantenimiento:view"),mantenimientoController.listarMantenimientos);
mantenimientoRouter.get('/mantenimientos/:id',  authorize("mantenimiento:view"),mantenimientoController.obtenerMantenimientoPorId);
mantenimientoRouter.put('/mantenimientos/:id',  authorize("mantenimiento:update"),mantenimientoController.actualizarMantenimiento);
mantenimientoRouter.delete('/mantenimientos/:id',  authorize("mantenimiento:delete"),mantenimientoController.eliminarMantenimiento);

// Nuevas rutas para obtener mantenimientos por `orden_mantenimiento_id` y `mantenimiento_preventivo_id`
mantenimientoRouter.get('/mantenimientos/orden/:orden_mantenimiento_id',  authorize("mantenimiento:view"),mantenimientoController.obtenerMantenimientoPorOrdenId);
mantenimientoRouter.get('/mantenimientos/preventivo/:mantenimiento_preventivo_id',  authorize("mantenimiento:view"),mantenimientoController.obtenerMantenimientoPorPreventivoId);

export default mantenimientoRouter;
