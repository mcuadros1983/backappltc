import express from "express";
import { authorize } from "../../middleware/authorize.js";

import {
  listarPlantillas,
  obtenerPlantilla,
  obtenerPlantillaCompleta,
  crearPlantilla,
  actualizarPlantilla,
  desactivarPlantilla,

} from "../../controllers/inspecciones/inspeccionPlantillaController.js";

import {
  crearCategoria,
  actualizarCategoria,
  desactivarCategoria,
} from "../../controllers/inspecciones/inspeccionCategoriaController.js";

import {
  crearItem,
  actualizarItem,
  desactivarItem,
} from "../../controllers/inspecciones/inspeccionItemController.js";

import {
  crearInspeccion,
  obtenerInspecciones,
  obtenerInspeccionPorId,
  anularInspeccion,
  actualizarRespuesta,
  actualizarRespuestasMasivo,
  trabajarRespuesta,
  subirEvidencia,
  eliminarEvidencia,
  enviarRevision,
  aprobarRespuesta,
  rechazarRespuesta,
  reabrirRespuesta,
} from "../../controllers/inspecciones/inspeccionController.js";

import {
  obtenerDashboardInspecciones,
  obtenerRankingSucursales,
  obtenerTopProblemas,
  obtenerObservacionesVencidas,
  obtenerReincidencias,
  obtenerResumenCategorias,
} from "../../controllers/inspecciones/inspeccionReportesController.js";


import {
  obtenerNotificaciones,
  marcarLeida
} from "../../controllers/inspecciones/inspeccionNotificacionController.js";

import multer from "multer";

const upload = multer({
  dest: "/tmp",
});


const router = express.Router();

// Plantillas
router.get(
  "/plantillas",
  authorize("inspecciones:view"),
  listarPlantillas
);

router.get(
  "/plantillas/:id/completa",
  authorize("inspecciones:view"),
  obtenerPlantillaCompleta
);

router.get(
  "/plantillas/:id",
  authorize("inspecciones:view"),
  obtenerPlantilla
);

router.post(
  "/plantillas",
  authorize("inspecciones:admin"),
  crearPlantilla
);

router.put(
  "/plantillas/:id",
  authorize("inspecciones:admin"),
  actualizarPlantilla
);

router.delete(
  "/plantillas/:id",
  authorize("inspecciones:admin"),
  desactivarPlantilla
);

// Categorías
router.post(
  "/categorias",
  authorize("inspecciones:admin"),
  crearCategoria
);

router.put(
  "/categorias/:id",
  authorize("inspecciones:admin"),
  actualizarCategoria
);

router.delete(
  "/categorias/:id",
  authorize("inspecciones:admin"),
  desactivarCategoria
);

// Ítems
router.post(
  "/items",
  authorize("inspecciones:admin"),
  crearItem
);

router.put(
  "/items/:id",
  authorize("inspecciones:admin"),
  actualizarItem
);

router.delete(
  "/items/:id",
  authorize("inspecciones:admin"),
  desactivarItem
);

router.post(
  "/",
  authorize("inspecciones:create"),
  crearInspeccion
);

router.get(
  "/",
  authorize("inspecciones:view"),
  obtenerInspecciones
);

router.get(
  "/dashboard",
  authorize("inspecciones:reportes"),
  obtenerDashboardInspecciones
);

router.get(
  "/ranking",
  authorize("inspecciones:reportes"),
  obtenerRankingSucursales
);

router.get(
  "/top-problemas",
  authorize("inspecciones:reportes"),
  obtenerTopProblemas
);

router.get(
  "/vencidas",
  authorize("inspecciones:view"),
  obtenerObservacionesVencidas
);

router.get(
  "/reincidencias",
  authorize("inspecciones:reportes"),
  obtenerReincidencias
);

router.get(
  "/resumen-categorias",
  authorize("inspecciones:reportes"),
  obtenerResumenCategorias
);

router.get(
  "/notificacion",
  authorize("inspecciones:view"),
  obtenerNotificaciones
);

router.put(
  "/notificacion/:id/leida",
  authorize("inspecciones:view"),
  marcarLeida
);

router.get(
  "/:id",
  authorize("inspecciones:view"),
  obtenerInspeccionPorId
);

router.put(
  "/:id/anular",
  authorize("inspecciones:admin"),
  anularInspeccion
);

router.put(
  "/:id/respuestas",
  authorize(
    "inspecciones:edit"
  ),
  actualizarRespuestasMasivo
);

router.put(
  "/respuestas/:id",
  authorize("inspecciones:edit"),
  actualizarRespuesta
);

router.put(
  "/respuestas/:id/trabajar",
  authorize("inspecciones:view"),
  trabajarRespuesta
);

router.post(
  "/respuestas/:id/evidencias",

  authorize(
    "inspecciones:view"
  ),

  upload.single("file"),

  subirEvidencia
);

router.delete(
  "/evidencias/:id",

  authorize(
    "inspecciones:edit"
  ),

  eliminarEvidencia
);

router.post(
  "/respuestas/:id/enviar-revision",
  authorize("inspecciones:view"),
  enviarRevision
);

router.post(
  "/respuestas/:id/aprobar",
  authorize("inspecciones:review"),
  aprobarRespuesta
);

router.post(
  "/respuestas/:id/rechazar",
  authorize("inspecciones:review"),
  rechazarRespuesta
);

router.post(
  "/respuestas/:id/reabrir",
  authorize("inspecciones:review"),
  reabrirRespuesta
);



export default router;
