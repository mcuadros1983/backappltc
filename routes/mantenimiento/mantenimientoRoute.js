// routes/equipoRoutes.js
import express from 'express';
import { Router } from 'express';
import * as mantenimientoController from '../../controllers/mantenimiento/mantenimientoController.js';

const mantenimientoRouter = Router()

mantenimientoRouter.post('/mantenimientos', mantenimientoController.crearMantenimiento);
mantenimientoRouter.get('/mantenimientos', mantenimientoController.listarMantenimientos);
mantenimientoRouter.get('/mantenimientos/:id', mantenimientoController.obtenerMantenimientoPorId);
mantenimientoRouter.put('/mantenimientos/:id', mantenimientoController.actualizarMantenimiento);
mantenimientoRouter.delete('/mantenimientos/:id', mantenimientoController.eliminarMantenimiento);

// Nuevas rutas para obtener mantenimientos por `orden_mantenimiento_id` y `mantenimiento_preventivo_id`
mantenimientoRouter.get('/mantenimientos/orden/:orden_mantenimiento_id', mantenimientoController.obtenerMantenimientoPorOrdenId);
mantenimientoRouter.get('/mantenimientos/preventivo/:mantenimiento_preventivo_id', mantenimientoController.obtenerMantenimientoPorPreventivoId);

export default mantenimientoRouter;
