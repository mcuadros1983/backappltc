import express from "express";

import {

    listarAvances,
    obtenerAvance,
    // crearAvance,
    actualizarAvance,
    eliminarAvance,

    registrarAvance

} from "../../controllers/evaluacion/metaAvanceController.js";

const router = express.Router();

/*=========================================================
  CONSULTAS
=========================================================*/

router.get(
    "/",
    listarAvances
);

router.get(
    "/:id",
    obtenerAvance
);

/*=========================================================
  NEGOCIO
=========================================================*/

router.post(
    "/registrar",
    registrarAvance
);

/*=========================================================
  ADMINISTRACIÓN
=========================================================*/

router.put(
    "/:id",
    actualizarAvance
);

router.delete(
    "/:id",
    eliminarAvance
);
export default router;