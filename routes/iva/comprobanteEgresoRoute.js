import { Router } from "express";
import * as controller from "../../controllers/iva/comprobanteEgresoController.js";

const comprobanteEgresoRouter = Router();

comprobanteEgresoRouter.get("/comprobantes-egreso/:id/detalle", controller.getComprobanteEgresoDetalle);
comprobanteEgresoRouter.post('/comprobantes-egreso', controller.crearComprobanteEgreso);
comprobanteEgresoRouter.get('/comprobantes-egreso', controller.listarComprobantesEgreso);
comprobanteEgresoRouter.get('/comprobantes-egreso/:id', controller.obtenerComprobanteEgresoPorId);
comprobanteEgresoRouter.put('/comprobantes-egreso/:id', controller.actualizarComprobanteEgreso);
comprobanteEgresoRouter.delete('/comprobantes-egreso/:id', controller.eliminarComprobanteEgreso);
comprobanteEgresoRouter.post('/comprobantes-egreso/emitir', controller.emitirComprobanteEgreso);


export default comprobanteEgresoRouter;
