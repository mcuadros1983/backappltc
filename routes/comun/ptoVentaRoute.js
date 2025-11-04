// routes/comun/ptoVentaRoute.js
import { Router } from "express";
import * as ptoVentaController from "../../controllers/comun/ptoVentaController.js";

const ptoVentaRouter = Router();

ptoVentaRouter.post("/ptos-venta", ptoVentaController.crearPtoVenta);
ptoVentaRouter.get("/ptos-venta", ptoVentaController.listarPtosVenta);
ptoVentaRouter.get("/ptos-venta/:id", ptoVentaController.obtenerPtoVentaPorId);
ptoVentaRouter.put("/ptos-venta/:id", ptoVentaController.actualizarPtoVenta);
ptoVentaRouter.delete("/ptos-venta/:id", ptoVentaController.eliminarPtoVenta);

export default ptoVentaRouter;
