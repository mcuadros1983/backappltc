import { Router } from "express";
import * as controller from "../../controllers/tesoreria/categoriaIngresoController.js";

const categoriaIngresoRouter = Router();

categoriaIngresoRouter.post("/categorias-ingreso", controller.crearCategoriaIngreso);
categoriaIngresoRouter.get("/categorias-ingreso", controller.listarCategoriasIngreso);
categoriaIngresoRouter.get("/categorias-ingreso/:id", controller.obtenerCategoriaIngresoPorId);
categoriaIngresoRouter.put("/categorias-ingreso/:id", controller.actualizarCategoriaIngreso);
categoriaIngresoRouter.delete("/categorias-ingreso/:id", controller.eliminarCategoriaIngreso);

export default categoriaIngresoRouter;
