// routes/comun/tipoComprobanteRoute.js
import { Router } from "express";
import * as tipoComprobanteController from "../../controllers/comun/tipoComprobanteController.js";

const tipoComprobanteRouter = Router();

tipoComprobanteRouter.post("/tipos-comprobantes", tipoComprobanteController.crearTipoComprobante);
tipoComprobanteRouter.get("/tipos-comprobantes", tipoComprobanteController.listarTiposComprobante);
tipoComprobanteRouter.get("/tipos-comprobantes/:id", tipoComprobanteController.obtenerTipoComprobantePorId);
tipoComprobanteRouter.put("/tipos-comprobantes/:id", tipoComprobanteController.actualizarTipoComprobante);
tipoComprobanteRouter.delete("/tipos-comprobantes/:id", tipoComprobanteController.eliminarTipoComprobante);

export default tipoComprobanteRouter;
