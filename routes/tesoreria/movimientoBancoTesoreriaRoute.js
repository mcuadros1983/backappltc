// routes/tesoreria/movimientoBancoTesoreriaRouter.js
import { Router } from "express";
import multer from "multer";
import * as controller from "../../controllers/tesoreria/movimientoBancoTesoreriaController.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

const movimientoBancoTesoreriaRouter = Router();

/* ------- RUTAS ESPECÍFICAS (antes de las genéricas y :id) ------- */

// Egresos varios (banco)
movimientoBancoTesoreriaRouter.post(
  "/movimientos-banco-tesoreria/egresos-independientes",
  controller.registrarEgresoBancoIndependiente
);

// Anticipo a Proveedores (banco)
movimientoBancoTesoreriaRouter.post(
  "/movimientos-banco-tesoreria/anticiposaproveedores",
  controller.registrarAnticipoProveedorBanco
);

// Importación masiva desde Excel (solo egresos varios)
movimientoBancoTesoreriaRouter.post(
  "/movimientos-banco-tesoreria/importar-excel",
  upload.single("file"),
  controller.importarMovimientosBancoExcel
);

// Ingresos varios (banco)
movimientoBancoTesoreriaRouter.post(
  "/movimientos-banco-tesoreria/ingresos/varios",
  controller.registrarIngresoBancoVarios
);

// Ingresos por cobranza de clientes (banco)
movimientoBancoTesoreriaRouter.post(
  "/movimientos-banco-tesoreria/ingresos/cobranza-clientes",
  controller.registrarIngresoBancoCobranzaClientes
);

/* ----------------- RUTAS COLECCIÓN (CRUD base) ----------------- */

// Listar (con filtros por query)
movimientoBancoTesoreriaRouter.get(
  "/movimientos-banco-tesoreria",
  controller.listarMovimientosBanco
);

// (Opcional) crear movimiento genérico (si tu controller existe y lo usás)
movimientoBancoTesoreriaRouter.post(
  "/movimientos-banco-tesoreria",
  controller.crearMovimientoBancoTesoreria // <-- o eliminá esta línea si no lo usás
);

/* ----------------- RUTAS ITEM (usar id numérico) ---------------- */

movimientoBancoTesoreriaRouter.get(
  "/movimientos-banco-tesoreria/:id(\\d+)",
  controller.obtenerMovimientoBancoPorId
);

movimientoBancoTesoreriaRouter.put(
  "/movimientos-banco-tesoreria/:id(\\d+)",
  controller.actualizarMovimientoBanco
);

movimientoBancoTesoreriaRouter.delete(
  "/movimientos-banco-tesoreria/:id(\\d+)",
  controller.eliminarMovimientoBancoTesoreria
);

export default movimientoBancoTesoreriaRouter;
