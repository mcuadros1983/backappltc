import { Router } from "express";
import * as controller from "../../controllers/iva/libroIVAController.js";

const libroIVARouter = Router();

libroIVARouter.post("/librosiva", controller.crearLibroIVA);
libroIVARouter.get("/librosiva", controller.listarLibrosIVA);
libroIVARouter.get("/librosiva/:id", controller.obtenerLibroIVAPorId);
libroIVARouter.put("/librosiva/:id", controller.actualizarLibroIVA);
libroIVARouter.delete("/librosiva/:id", controller.eliminarLibroIVA);

export default libroIVARouter;
