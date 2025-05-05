// rindeRouter.js
import { Router } from "express";
import * as rindeController from "../../controllers/rinde/rindeController.js";
import express from "express";
import multer from "multer";

const rindeRouter = Router();

// Configuración de multer para manejar la carga de archivos
const upload = multer({ dest: 'uploads/' });

// Rutas para obtener ventas totales
rindeRouter.post(
  "/crearmovimientointerno",
  rindeController.crearMovimientoInterno
);
rindeRouter.post(
  "/obtenermovimientosfiltrados",
  rindeController.obtenerMovimientosFiltrados
);
rindeRouter.post(
  "/obtenermontomovimientosfiltrados",
  rindeController.obtenerMontoMovimientosFiltrados
);
rindeRouter.delete(
  "/eliminarmovimientos/:movimientoId",
  rindeController.eliminarMovimientoInterno
);
rindeRouter.post("/crearinventario", rindeController.crearInventario);
rindeRouter.get("/listarinventarios", rindeController.listarInventarios);
rindeRouter.get("/obtenerinventarios", rindeController.obtenerInventarios);
rindeRouter.post(
  "/obtenerinventariosfiltrados",
  rindeController.obtenerInventariosFiltrados
);
rindeRouter.post(
  "/obtenermontoinventariosfiltrados",
  rindeController.obtenerMontoInventariosFiltrados
);
rindeRouter.get(
  "/inventario/:inventarioId/articulos",
  rindeController.listarInventariosArticulos
);
rindeRouter.delete(
  "/inventario/:inventarioId",
  rindeController.eliminarInventario
);
rindeRouter.post("/crearrinde", rindeController.crearRinde);
rindeRouter.get("/obtenerrindes", rindeController.obtenerRindes);
rindeRouter.post(
  "/obtenerrindefiltrado",
  rindeController.obtenerRindePorSucursalMesAnio
);
rindeRouter.delete("/eliminarrinde/:rindeId", rindeController.eliminarRinde);
rindeRouter.post("/crearformula", rindeController.crearFormula);
rindeRouter.get("/obtenerformulas", rindeController.obtenerFormulas);
rindeRouter.get(
  "/obtenerformulaporid/:formulaId",
  rindeController.obtenerFormulaPorId
);
rindeRouter.delete(
  "/eliminarformula/:formulaId",
  rindeController.eliminarFormula
);
rindeRouter.put("/editarFormula/:formulaId", rindeController.editarFormula);
rindeRouter.post("/obtenerstock", rindeController.obtenerStock);

rindeRouter.post("/movimientos-otro", rindeController.obtenerMovimientosFiltradosOtro);
rindeRouter.post("/movimientos-otro/monto", rindeController.obtenerMontoMovimientosFiltradosOtro);
rindeRouter.post("/movimientos-otro/crear", rindeController.crearMovimientoOtro);
rindeRouter.delete("/movimientos-otro/:movimientoId", rindeController.eliminarMovimientoOtro);
rindeRouter.post('/movimientos-otro-excel', upload.single('file'), rindeController.crearMovimientosOtrosDesdeExcel);
rindeRouter.post("/movimientos-otro/fechas-unicas", rindeController.obtenerFechasUnicasMovimientosOtros);
rindeRouter.post("/movimientos-otro/eliminar-por-fechas", rindeController.eliminarMovimientosOtrosPorFechas);
rindeRouter.post("/cargarinventarios-excel",upload.single("file"), rindeController.cargarInventarioDesdeExcel);

// Exportar el enrutador
export default rindeRouter;
