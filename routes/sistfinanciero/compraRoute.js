import { Router } from "express";
import * as controller from "../../controllers/sistfinanciero/compraController.js";

const compraRouter = Router();

compraRouter.post("/compras", controller.crearCompra);
compraRouter.get("/compras", controller.listarCompras);
compraRouter.get("/compras/:id", controller.obtenerCompraPorId);
compraRouter.put("/compras/:id", controller.actualizarCompra);
compraRouter.delete("/compras/:id", controller.eliminarCompra);

export default compraRouter;
