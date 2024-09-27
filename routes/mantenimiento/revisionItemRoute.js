// routes/revisionItemRoutes.js
import express from 'express';
import { Router } from 'express';
import * as revisionItemController from '../../controllers/mantenimiento/revisionItemController.js';

const revisionItemRouter = Router();

revisionItemRouter.post('/revisiones', revisionItemController.crearRevisionItem);
revisionItemRouter.get('/revisiones/item/:item_equipo_id', revisionItemController.listarRevisionesPorItem);
revisionItemRouter.get('/revisiones/:id', revisionItemController.obtenerRevisionPorId);
revisionItemRouter.put('/revisiones/:id', revisionItemController.actualizarRevisionItem);
revisionItemRouter.delete('/revisiones/:id', revisionItemController.eliminarRevisionItem);

export default revisionItemRouter;
