// routes/finanzas/gastoEstimadoRoutes.js
import { Router } from "express";
import multer from "multer";
import * as ctrl from "../../controllers/tesoreria/gastoEstimadoController.js";
import * as pagosCtrl from "../../controllers/tesoreria/gastoEstimadoPagoController.js";

const gastoEstimadoRouter = Router();

// --- upload en memoria (hasta 10MB) ---
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

/* ============================
   INSTANCIAS  (primero!)
============================ */
gastoEstimadoRouter.get("/gasto-estimado/instancias", ctrl.listarInstancias);
gastoEstimadoRouter.get("/gasto-estimado/instancias/:id(\\d+)", ctrl.obtenerInstancia);
gastoEstimadoRouter.put("/gasto-estimado/instancias/:id(\\d+)", ctrl.actualizarInstancia);
gastoEstimadoRouter.delete("/gasto-estimado/instancias/:id(\\d+)", ctrl.eliminarInstancia);

// Pagos vinculados a una instancia
gastoEstimadoRouter.get("/gasto-estimado/instancias/:id(\\d+)/pagos", pagosCtrl.listarPagos);
// 
gastoEstimadoRouter.post("/gasto-estimado/instancias/:id(\\d+)/pagos", pagosCtrl.aplicarPago);
gastoEstimadoRouter.delete("/gasto-estimado/instancias/:id(\\d+)/pagos/:pagoId(\\d+)", pagosCtrl.eliminarPago);

/* ============================
   PLANTILLAS
============================ */
gastoEstimadoRouter.post("/gasto-estimado", ctrl.crearPlantilla);
gastoEstimadoRouter.get("/gasto-estimado", ctrl.listarPlantillas);
gastoEstimadoRouter.get("/gasto-estimado/:id(\\d+)", ctrl.obtenerPlantilla);
gastoEstimadoRouter.put("/gasto-estimado/:id(\\d+)", ctrl.actualizarPlantilla);
gastoEstimadoRouter.delete("/gasto-estimado/:id(\\d+)", ctrl.eliminarPlantilla);

// Generación de instancias desde una plantilla
gastoEstimadoRouter.post("/gasto-estimado/:id(\\d+)/generar", ctrl.generarInstancias);

gastoEstimadoRouter.get("/gasto-estimado/unicos/template.xlsx", ctrl.descargarTemplateXlsxUnicos);

// === NUEVO: importar “únicos” ===
gastoEstimadoRouter.post(
  "/gasto-estimado/importar-unicos",
  upload.single("file"),
  ctrl.importarPlantillasUnicas
);

export default gastoEstimadoRouter;
