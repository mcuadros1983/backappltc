// routes/comun/formapagoRoute.js
import { Router } from "express";
import * as formaPagoTesoreriaController from "../../controllers/comun/formaPagoTesoreriaController.js";

const formaPagoTesoreriaRouter = Router();

formaPagoTesoreriaRouter.post("/formas-pago-tesoreria", formaPagoTesoreriaController.crearFormaPagoTesoreria);
formaPagoTesoreriaRouter.get("/formas-pago-tesoreria", formaPagoTesoreriaController.listarFormasPagoTesoreria);
formaPagoTesoreriaRouter.get("/formas-pago-tesoreria/:id", formaPagoTesoreriaController.obtenerFormaPagoTesoreriaPorId);
formaPagoTesoreriaRouter.put("/formas-pago-tesoreria/:id", formaPagoTesoreriaController.actualizarFormaPagoTesoreria);
formaPagoTesoreriaRouter.delete("/formas-pago-tesoreria/:id", formaPagoTesoreriaController.eliminarFormaPagoTesoreria);

export default formaPagoTesoreriaRouter;
