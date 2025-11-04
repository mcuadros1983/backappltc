import { Router } from "express";
import * as controller from "../../controllers/tesoreria/ordenDePagoController.js";

const ordenPagoRouter = Router();
ordenPagoRouter.post("/ordenes-pago/anticipos", controller.registrarAnticipoProveedor);
ordenPagoRouter.post("/ordenes-pago", controller.crearOrdenPago);
ordenPagoRouter.get("/ordenes-pago", controller.listarOrdenesPago);
ordenPagoRouter.get("/ordenes-pago/:id", controller.obtenerOrdenPagoPorId);
ordenPagoRouter.get("/ordenes-pago/:id/pagos", controller.obtenerPagosDeOrden);
ordenPagoRouter.put("/ordenes-pago/:id", controller.actualizarOrdenPago);
ordenPagoRouter.delete("/ordenes-pago/:id", controller.eliminarOrdenPago);

// NUEVAS
ordenPagoRouter.get(
  "/ordenes-pago/proveedor/:proveedorId/comprobantes-impagos",
  controller.listarComprobantesImpagosProveedor
);

ordenPagoRouter.post(
  "/ordenes-pago/emitir",
  controller.emitirOrdenPago
);
export default ordenPagoRouter;
