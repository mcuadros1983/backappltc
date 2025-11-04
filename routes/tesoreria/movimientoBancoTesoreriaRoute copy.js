// routes/tesoreria/movimientoBancoTesoreriaRouter.js
import { Router } from "express";
import * as controller from "../../controllers/tesoreria/movimientoBancoTesoreriaController.js";
import multer from "multer";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

const movimientoBancoTesoreriaRouter = Router();

/* ------- RUTAS ESPECÍFICAS (ANTES DE :id) ------- */

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

// ⬇️ NUEVO: importación masiva desde Excel (solo egresos varios)
movimientoBancoTesoreriaRouter.post("/movimientos-banco-tesoreria/importar-excel", upload.single("file"), controller.importarMovimientosBancoExcel
);


/* -------------- CRUD Banco Tesorería -------------- */

movimientoBancoTesoreriaRouter.post(
  "/movimientos-banco-tesoreria",
  controller.crearMovimientoBancoTesoreria
);

movimientoBancoTesoreriaRouter.get(
  "/movimientos-banco-tesoreria",
  controller.listarMovimientosBancoTesoreria
);

movimientoBancoTesoreriaRouter.get(
  "/movimientos-banco-tesoreria/:id(\\d+)",
  controller.obtenerMovimientoBancoTesoreriaPorId
);

movimientoBancoTesoreriaRouter.put(
  "/movimientos-banco-tesoreria/:id(\\d+)",
  controller.actualizarMovimientoBancoTesoreria
);

movimientoBancoTesoreriaRouter.delete(
  "/movimientos-banco-tesoreria/:id(\\d+)",
  controller.eliminarMovimientoBancoTesoreria
);



export default movimientoBancoTesoreriaRouter;
