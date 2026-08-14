import express from "express";

import {
    obtenerResumenDashboard,
    // obtenerDashboard,

    // obtenerDashboardAnalitico,

    // obtenerDashboardGerencial,

    obtenerAvisos

} from "../../controllers/evaluacion/dashboardController.js";

const router = express.Router();


/*=========================================================
  DASHBOARD
=========================================================*/

router.get(
    "/resumen",
    obtenerResumenDashboard
);

/*=========================================================
  DASHBOARD
=========================================================*/

// router.get(

//     "/",

//     obtenerDashboard

// );

/*=========================================================
  DASHBOARD ANALITICO
=========================================================*/

// router.get(

//     "/analitico",

//     obtenerDashboardAnalitico

// );

/*=========================================================
  DASHBOARD GERENCIAL
=========================================================*/

// router.get(

//     "/gerencial",

//     obtenerDashboardGerencial

// );

/*=========================================================
  AVISOS
=========================================================*/

router.get(

    "/avisos",

    obtenerAvisos

);

export default router;