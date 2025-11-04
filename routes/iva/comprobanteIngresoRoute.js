import { Router } from "express";
import * as controller from "../../controllers/iva/comprobanteIngresoController.js";

const comprobanteIngresoRouter = Router();

comprobanteIngresoRouter.post('/comprobantes-ingreso', controller.crearComprobanteIngreso);
comprobanteIngresoRouter.get('/comprobantes-ingreso', controller.listarComprobantesIngreso);
comprobanteIngresoRouter.get('/comprobantes-ingreso/:id', controller.obtenerComprobanteIngresoPorId);
comprobanteIngresoRouter.put('/comprobantes-ingreso/:id', controller.actualizarComprobanteIngreso);
comprobanteIngresoRouter.delete('/comprobantes-ingreso/:id', controller.eliminarComprobanteIngreso);

export default comprobanteIngresoRouter;
