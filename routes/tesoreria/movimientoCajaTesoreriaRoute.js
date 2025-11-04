import { Router } from "express";
import * as controller from "../../controllers/tesoreria/movimientoCajaTesoreriaController.js";

const movimientoCajaTesoreriaRouter = Router();

/* ----------------- RUTAS ESPECÍFICAS (ANTES DE :id) ----------------- */

// Listar órdenes de pago libres (pendientes de aplicación)
movimientoCajaTesoreriaRouter.get(
  "/movimientos-caja-tesoreria/ordenes-libres",
  controller.listarOrdenesPagoLibres
);

// Registrar egreso de caja independiente (crea OrdenPago pendiente + MovimientoCaja)
movimientoCajaTesoreriaRouter.post(
  "/movimientos-caja-tesoreria/egresos-independientes",
  controller.registrarEgresoCajaIndependiente
);

// Anular una orden independiente (si no fue aplicada)
movimientoCajaTesoreriaRouter.put(
  "/movimientos-caja-tesoreria/ordenes/:ordenpago_id(\\d+)/anular",
  controller.anularEgresoCajaIndependiente
);

/* ----------------- CRUD Movimientos de Caja ----------------- */

movimientoCajaTesoreriaRouter.post(
  "/movimientos-caja-tesoreria",
  controller.crearMovimientoCajaTesoreria
);

movimientoCajaTesoreriaRouter.get(
  "/movimientos-caja-tesoreria",
  controller.listarMovimientosCajaTesoreria
);

movimientoCajaTesoreriaRouter.get(
  "/movimientos-caja-tesoreria/:id(\\d+)",
  controller.obtenerMovimientoCajaTesoreriaPorId
);

movimientoCajaTesoreriaRouter.put(
  "/movimientos-caja-tesoreria/:id(\\d+)",
  controller.actualizarMovimientoCajaTesoreria
);

movimientoCajaTesoreriaRouter.delete(
  "/movimientos-caja-tesoreria/:id(\\d+)",
  controller.eliminarMovimientoCajaTesoreria
);

movimientoCajaTesoreriaRouter.post("/movimientos-caja-tesoreria/anticiposaproveedores", controller.registrarAnticipoProveedor);

movimientoCajaTesoreriaRouter.post(
  "/movimientos-caja-tesoreria/deposito-bancario",
  controller.registrarDepositoBancario
);

movimientoCajaTesoreriaRouter.post("/movimientos-caja-tesoreria/ingresos/cobranza-clientes", controller.registrarIngresoCobranzaClientes);
movimientoCajaTesoreriaRouter.post("/movimientos-caja-tesoreria/ingresos/varios", controller.registrarIngresoVarios);

export default movimientoCajaTesoreriaRouter;
