import express from "express";

import {

    obtenerConfiguracion,
    guardarConfiguracion

} from "../../controllers/evaluacion/evaluacionSistemaController.js";

const router = express.Router();

/*=========================================================
  CONFIGURACIÓN DEL MÓDULO
=========================================================*/

router.get(
    "/",
    obtenerConfiguracion
);

router.put(
    "/",
    guardarConfiguracion
);

export default router;