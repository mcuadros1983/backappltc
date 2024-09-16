// routes/categoriaEquipoRoutes.js
import express from 'express';
import { Router } from 'express';
import * as categoriaEquipoController from '../../controllers/mantenimiento/categoriaEquipoController.js';

const categoriaEquipoRouter = Router()

categoriaEquipoRouter.post('/categorias-equipos', categoriaEquipoController.crearCategoriaEquipo);
categoriaEquipoRouter.get('/categorias-equipos', categoriaEquipoController.listarCategoriasEquipo);
categoriaEquipoRouter.get('/categorias-equipos/:id', categoriaEquipoController.obtenerCategoriaEquipoPorId);
categoriaEquipoRouter.put('/categorias-equipos/:id', categoriaEquipoController.actualizarCategoriaEquipo);
categoriaEquipoRouter.delete('/categorias-equipos/:id', categoriaEquipoController.eliminarCategoriaEquipo);

export default categoriaEquipoRouter;