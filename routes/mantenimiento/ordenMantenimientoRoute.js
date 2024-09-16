
import express from 'express';
import { Router } from 'express';
import * as ordenMantenimientoController from '../../controllers/mantenimiento/ordenMantenimientoController.js';

const ordenMantenimientoRouter = Router()

ordenMantenimientoRouter.post('/ordenes_mantenimiento', ordenMantenimientoController.crearOrdenMantenimiento);
ordenMantenimientoRouter.get('/ordenes_mantenimiento', ordenMantenimientoController.listarOrdenes);
ordenMantenimientoRouter.get('/ordenes_mantenimiento/:id', ordenMantenimientoController.obtenerOrdenPorId);
ordenMantenimientoRouter.put('/ordenes_mantenimiento/:id', ordenMantenimientoController.actualizarOrden);
ordenMantenimientoRouter.delete('/ordenes_mantenimiento/:id', ordenMantenimientoController.eliminarOrden);

export default ordenMantenimientoRouter;
