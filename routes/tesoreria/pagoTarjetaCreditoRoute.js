import { Router } from "express";
import * as ctrl from "../../controllers/tesoreria/pagoTarjetaCreditoController.js";
// import * as ctrl from "../../controllers/tesoreria/pagoTarjetaCreditoController.js";

const pagoTarjetaCreditoRouter = Router();

/* ------- Altas específicas ------- */
pagoTarjetaCreditoRouter.post("/pagos-tarjeta/egresos-independientes", ctrl.registrarEgresoTarjetaIndependiente);
pagoTarjetaCreditoRouter.post("/pagos-tarjeta/anticiposaproveedores", ctrl.registrarAnticipoProveedorTarjeta);

/* ------- CRUD / Listado ------- */
pagoTarjetaCreditoRouter.post("/pagos-tarjeta", ctrl.crearPagoTarjeta);
pagoTarjetaCreditoRouter.get("/pagos-tarjeta", ctrl.listarPagosTarjeta);
pagoTarjetaCreditoRouter.get("/pagos-tarjeta/:id(\\d+)", ctrl.obtenerPagoTarjeta);
pagoTarjetaCreditoRouter.put("/pagos-tarjeta/:id(\\d+)", ctrl.actualizarPagoTarjeta);
pagoTarjetaCreditoRouter.delete("/pagos-tarjeta/:id(\\d+)", ctrl.eliminarPagoTarjeta);

/* ------- Utilidades ------- */
pagoTarjetaCreditoRouter.get("/tarjetas-comunes", ctrl.listarTarjetasPorEmpresa); // filtros empresa_id, terminacion

export default pagoTarjetaCreditoRouter;
