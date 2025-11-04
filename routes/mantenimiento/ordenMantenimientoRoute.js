
import express from 'express';
import { Router } from 'express';
import * as ordenMantenimientoController from '../../controllers/mantenimiento/ordenMantenimientoController.js';
import JWTAuth from "../../middleware/jwtMiddleware.js";
import { attachPermissions } from "../../middleware/attachPermissions.js";
import { authorize } from "../../middleware/authorize.js"; // o authorize

const ordenMantenimientoRouter = Router()

ordenMantenimientoRouter.post('/ordenes_mantenimiento',  JWTAuth, attachPermissions, authorize("orden_mantenimiento:create"), ordenMantenimientoController.crearOrdenMantenimiento);
ordenMantenimientoRouter.get('/ordenes_mantenimiento',  JWTAuth, attachPermissions, authorize("orden_mantenimiento:view"), ordenMantenimientoController.listarOrdenes);
ordenMantenimientoRouter.get('/ordenes_mantenimiento/:id',  JWTAuth, attachPermissions, authorize("orden_mantenimiento:view"), ordenMantenimientoController.obtenerOrdenPorId);
ordenMantenimientoRouter.put('/ordenes_mantenimiento/:id',  JWTAuth, attachPermissions, authorize("orden_mantenimiento:update"), ordenMantenimientoController.actualizarOrden);
ordenMantenimientoRouter.delete('/ordenes_mantenimiento/:id',  JWTAuth, attachPermissions, authorize("orden_mantenimiento:delete"), ordenMantenimientoController.eliminarOrden);

export default ordenMantenimientoRouter;
