import express from "express";

import {

    listarComunicaciones,

    obtenerComunicacion

}
from "../../controllers/evaluacion/comunicacionController.js";

const router = express.Router();

/*=========================================================
  COMUNICACIONES
=========================================================*/

router.get(

    "/",

    listarComunicaciones

);

router.get(

    "/:id",

    obtenerComunicacion

);

export default router;