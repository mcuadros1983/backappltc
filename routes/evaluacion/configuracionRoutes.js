import express from "express";

import {

   listarTiposEvaluacion,
    obtenerTipoEvaluacion,
    crearTipoEvaluacion,
    actualizarTipoEvaluacion,
    eliminarTipoEvaluacion

} from "../../controllers/evaluacion/tipoController.js";

import {

    listarCriterios,
    obtenerCriterio,
    crearCriterio,
    actualizarCriterio,
    eliminarCriterio,

} from "../../controllers/evaluacion/criterioController.js";

import {

    listarPeriodos,
    obtenerPeriodo,
    crearPeriodo,
    actualizarPeriodo,
    eliminarPeriodo,

} from "../../controllers/evaluacion/periodoController.js";

import {

    listarPlantillas,
    obtenerPlantilla,
    crearPlantilla,
    actualizarPlantilla,
    eliminarPlantilla,
    obtenerDetallePlantilla,
    agregarDetallePlantilla,
    actualizarDetallePlantilla,
    eliminarDetallePlantilla,

} from "../../controllers/evaluacion/plantillaController.js";


import {
    obtenerConfiguracion,
    guardarConfiguracion
} from "../../controllers/evaluacion/configuracionController.js";

const router = express.Router();

/* ======================================================
   TIPOS
====================================================== */

router.get(
    "/tipos",
    listarTiposEvaluacion
);

router.get(
    "/tipos/:id",
    obtenerTipoEvaluacion   
);

router.post(
    "/tipos",
    crearTipoEvaluacion 
);

router.put(
    "/tipos/:id",
    actualizarTipoEvaluacion    
);

router.delete(
    "/tipos/:id",
    eliminarTipoEvaluacion
);

/* ======================================================
   CRITERIOS
====================================================== */

router.get(
    "/criterios",
    listarCriterios
);

router.get(
    "/criterios/:id",
    obtenerCriterio
);

router.post(
    "/criterios",
    crearCriterio
);

router.put(
    "/criterios/:id",
    actualizarCriterio
);

router.delete(
    "/criterios/:id",
    eliminarCriterio
);

/* ======================================================
   PERIODOS
====================================================== */

router.get(
    "/periodos",
    listarPeriodos
);

router.get(
    "/periodos/:id",
    obtenerPeriodo
);

router.post(
    "/periodos",
    crearPeriodo
);

router.put(
    "/periodos/:id",
    actualizarPeriodo
);

router.delete(
    "/periodos/:id",
    eliminarPeriodo
);

/* ======================================================
   PLANTILLAS
====================================================== */

router.get(
    "/plantillas",
    listarPlantillas
);

router.get(
    "/plantillas/:id",
    obtenerPlantilla
);

router.post(
    "/plantillas",
    crearPlantilla
);

router.put(
    "/plantillas/:id",
    actualizarPlantilla
);

router.delete(
    "/plantillas/:id",
    eliminarPlantilla
);

/* ==========================================================
   DETALLE PLANTILLAS
========================================================== */

router.get(
    "/plantillas/:id/detalle",
    obtenerDetallePlantilla
);

router.post(
    "/plantillas/:id/detalle",
    agregarDetallePlantilla
);

router.put(
    "/plantillas/detalle/:id",
    actualizarDetallePlantilla
);

router.delete(
    "/plantillas/detalle/:id",
    eliminarDetallePlantilla
);

router.get(
    "/configuracion/general",
    // authorize("evaluacion:config"),
    obtenerConfiguracion
);

router.put(
    "/configuracion/general",
    // authorize("evaluacion:config"),
    guardarConfiguracion
);

export default router;