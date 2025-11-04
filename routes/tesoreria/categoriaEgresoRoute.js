import { Router } from "express";
import * as controller from "../../controllers/tesoreria/categoriaEgresoController.js";

const categoriaEgresoRouter = Router();

categoriaEgresoRouter.post("/categorias-egreso", controller.crearCategoriaEgreso);
categoriaEgresoRouter.get("/categorias-egreso", controller.listarCategoriasEgreso);
categoriaEgresoRouter.get("/categorias-egreso/:id", controller.obtenerCategoriaEgresoPorId);
categoriaEgresoRouter.put("/categorias-egreso/:id", controller.actualizarCategoriaEgreso);
categoriaEgresoRouter.delete("/categorias-egreso/:id", controller.eliminarCategoriaEgreso);

export default categoriaEgresoRouter;
