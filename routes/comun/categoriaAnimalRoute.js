// routes/comun/categoriaAnimalRoute.js
import { Router } from "express";
import * as categoriaAnimalController from "../../controllers/comun/categoriaAnimalController.js";

const categoriaAnimalRouter = Router();

categoriaAnimalRouter.post("/categorias-animales", categoriaAnimalController.crearCategoriaAnimal);
categoriaAnimalRouter.get("/categorias-animales", categoriaAnimalController.listarCategoriasAnimal);
categoriaAnimalRouter.get("/categorias-animales/:id", categoriaAnimalController.obtenerCategoriaAnimalPorId);
categoriaAnimalRouter.put("/categorias-animales/:id", categoriaAnimalController.actualizarCategoriaAnimal);
categoriaAnimalRouter.delete("/categorias-animales/:id", categoriaAnimalController.eliminarCategoriaAnimal);

export default categoriaAnimalRouter;
