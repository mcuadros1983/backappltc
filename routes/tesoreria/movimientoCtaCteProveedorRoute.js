// routes/tesoreria/movimientoCtaCteProveedor.routes.js
import { Router } from "express";
import * as controller from "../../controllers/tesoreria/movimientoCtaCteProveedorController.js";

const movimientoCtaCteProveedorRouter = Router();

movimientoCtaCteProveedorRouter.get("/movimientos-cta-cte-proveedor/abonos-disponibles", controller.listarAbonosDisponibles);

movimientoCtaCteProveedorRouter.post("/movimientos-cta-cte-proveedor/aplicar-anticipo", controller.aplicarAnticipoExistenteCtaCte);

movimientoCtaCteProveedorRouter.post("/movimientos-cta-cte-proveedor/anular-aplicacion-anticipo", controller.anularAplicacionAnticipoExistenteCtaCte);

/** ---- Rutas específicas/estáticas primero (sin params) ---- */
movimientoCtaCteProveedorRouter.get(
  "/movimientos-cta-cte-proveedor/saldos",
  controller.listarSaldosCtaCteProveedores
);

movimientoCtaCteProveedorRouter.get(
  "/movimientos-cta-cte-proveedor/cargos-abiertos",
  controller.listarCargosAbiertosCtaCteProveedor
);

movimientoCtaCteProveedorRouter.post(
  "/movimientos-cta-cte-proveedor/aplicar",
  controller.aplicarAbonoCtaCteProveedor
);

movimientoCtaCteProveedorRouter.post(
  "/movimientos-cta-cte-proveedor/aplicar/anular",
  controller.anularAplicacionAbonoCtaCteProveedor
);

/** ---- Rutas con varios segmentos y params específicos ---- */
movimientoCtaCteProveedorRouter.get(
  "/movimientos-cta-cte-proveedor/:proveedorId/movimientos",
  controller.listarMovimientosProveedor
);

/** ---- Colección base ---- */
movimientoCtaCteProveedorRouter.post(
  "/movimientos-cta-cte-proveedor",
  controller.crearMovimientoCtaCteProveedor
);

movimientoCtaCteProveedorRouter.get(
  "/movimientos-cta-cte-proveedor",
  controller.listarMovimientosCtaCteProveedor
);

/** ---- ¡Paramétricas al final! ---- */
movimientoCtaCteProveedorRouter.get(
  "/movimientos-cta-cte-proveedor/:id",
  controller.obtenerMovimientoCtaCteProveedorPorId
);

movimientoCtaCteProveedorRouter.put(
  "/movimientos-cta-cte-proveedor/:id",
  controller.actualizarMovimientoCtaCteProveedor
);

movimientoCtaCteProveedorRouter.delete(
  "/movimientos-cta-cte-proveedor/:id",
  controller.eliminarMovimientoCtaCteProveedor
);


export default movimientoCtaCteProveedorRouter;
