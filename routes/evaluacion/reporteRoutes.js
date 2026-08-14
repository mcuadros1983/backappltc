import express from "express";

import {

    obtenerReporteEvaluaciones

} from "../../controllers/evaluacion/reporteController.js";

const router = express.Router();

/* ==========================================================
   REPORTES
========================================================== */

router.get(

    "/",

    obtenerReporteEvaluaciones

);

export default router;