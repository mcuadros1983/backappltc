import { Router } from "express";
import * as controller from "../../controllers/iva/compraProyectadaController.js";

const CompraProyectadaRouter = Router();

// GET /iva/compra-proyectada?empresa_id=&periodo_id=&proveedor_id=&informada=&desde=&hasta=
CompraProyectadaRouter.get("/compraproyectada", controller.listar);

// POST /iva/compra-proyectada
CompraProyectadaRouter.post("/compraproyectada", controller.crear);

// PUT /iva/compra-proyectada/:id
CompraProyectadaRouter.put("/compraproyectada/:id", controller.actualizar);

// DELETE /iva/compra-proyectada/:id
CompraProyectadaRouter.delete("/compraproyectada/:id", controller.eliminar);

export default CompraProyectadaRouter;
