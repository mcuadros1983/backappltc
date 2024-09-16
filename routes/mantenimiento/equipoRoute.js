// routes/equipoRoutes.js
import express from 'express';
import { Router } from 'express';
import * as equipoController from '../../controllers/mantenimiento/equipoController.js';

const equipoRouter = Router()

equipoRouter.post('/equipos', equipoController.crearEquipo);
equipoRouter.get('/equipos', equipoController.listarEquipos);
equipoRouter.get('/equipos/:id', equipoController.obtenerEquipoPorId);
equipoRouter.put('/equipos/:id', equipoController.actualizarEquipo);
equipoRouter.delete('/equipos/:id', equipoController.eliminarEquipo);

// Nueva ruta para listar equipos por sucursal_id
equipoRouter.get('/equipos/sucursal/:sucursal_id', equipoController.listarEquiposPorSucursal);


export default equipoRouter;
