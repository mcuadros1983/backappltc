// routes/equipoRoutes.js
import express from 'express';
import { Router } from 'express';
import * as mantenimientoPreventivoController from '../../controllers/mantenimiento/mantenimientoPreventivoController.js';

const mantenimientoPreventivoRouter = Router()

mantenimientoPreventivoRouter.post('/mantenimientos-preventivos', mantenimientoPreventivoController.crearMantenimientoPreventivo);
mantenimientoPreventivoRouter.get('/mantenimientos-preventivos', mantenimientoPreventivoController.listarMantenimientosPreventivos);
mantenimientoPreventivoRouter.get('/mantenimientos-preventivos/:id', mantenimientoPreventivoController.obtenerMantenimientoPreventivoPorId);
mantenimientoPreventivoRouter.put('/mantenimientos-preventivos/:id', mantenimientoPreventivoController.actualizarMantenimientoPreventivo);
mantenimientoPreventivoRouter.delete('/mantenimientos-preventivos/:id', mantenimientoPreventivoController.eliminarMantenimientoPreventivo);

export default mantenimientoPreventivoRouter;
