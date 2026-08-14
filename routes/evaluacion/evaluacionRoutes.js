// routes/evaluacion/evaluacionRoutes.js

import express from "express";

import {

    listarEvaluaciones,
    obtenerEvaluacion,
    crearEvaluacion,
    actualizarEvaluacion,
    eliminarEvaluacion,

    guardarRespuestasEvaluacion,
    finalizarEvaluacion,
    cambiarEstadoEvaluacion,
    duplicarEvaluacion,
    obtenerFormularioEvaluacion,
    listarMisEvaluaciones,
    obtenerEvaluacionesEmpleado,
    // obtenerResultadoEvaluacion,
    // obtenerResultadoEvaluacion,
    obtenerReporte


} from "../../controllers/evaluacion/evaluacionController.js";
import {

    obtenerResultadoEvaluacion,
    obtenerComparativo
} from "../../controllers/evaluacion/resultadoController.js";

const router = express.Router();

router.get(

    "/reportes/comparativo",
    obtenerComparativo

);

router.get(
    "/reportes",
    obtenerReporte
);

router.get(
    "/empleados/:id",
    obtenerEvaluacionesEmpleado
);


/* ==========================================================
   EVALUACIONES
========================================================== */

router.get(
    "/",
    listarEvaluaciones
);

router.get(
    "/:id",
    obtenerEvaluacion
);

router.post(
    "/",
    crearEvaluacion
);

router.put(
    "/:id",
    actualizarEvaluacion
);

router.delete(
    "/:id",
    eliminarEvaluacion
);


router.get(
    "/:id/resultado",
    obtenerResultadoEvaluacion
);

/* ==========================================================
   RESPUESTAS
========================================================== */

router.post(
    "/:id/respuestas",
    guardarRespuestasEvaluacion
);

/* ==========================================================
   FINALIZAR
========================================================== */

router.post(
    "/:id/finalizar",
    finalizarEvaluacion
);

/* ==========================================================
   CAMBIAR ESTADO
========================================================== */

router.put(
    "/:id/estado",
    cambiarEstadoEvaluacion
);

/* ==========================================================
   DUPLICAR
========================================================== */

router.post(
    "/:id/duplicar",
    duplicarEvaluacion
);

router.get(
    "/:id/formulario",
    obtenerFormularioEvaluacion
);

/************************************************
 RESULTADO
************************************************/

// router.get(

//     "/:id/resultado",

//     obtenerResultadoEvaluacion

// );

router.get(
    "/mis-evaluaciones",
    listarMisEvaluaciones
);

/* ==========================================================
   HISTORIAL EMPLEADO
========================================================== */

router.get(

    "/:id/resultado",

    // authorize(

    //     "EVALUACION_VER"

    // ),

    obtenerResultadoEvaluacion

);


export default router;