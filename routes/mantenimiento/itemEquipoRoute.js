// routes/itemEquipoRoutes.js
import express from 'express';
import { Router } from 'express';
import * as itemEquipoController from '../../controllers/mantenimiento/itemEquipoController.js';

const itemEquipoRouter = Router();

itemEquipoRouter.post('/items', itemEquipoController.crearItemEquipo);
itemEquipoRouter.get('/items/equipo/:equipo_id', itemEquipoController.listarItemsPorEquipo);
itemEquipoRouter.get('/items/:id', itemEquipoController.obtenerItemPorId);
itemEquipoRouter.put('/items/:id', itemEquipoController.actualizarItemEquipo);
itemEquipoRouter.delete('/items/:id', itemEquipoController.eliminarItemEquipo);

export default itemEquipoRouter;
