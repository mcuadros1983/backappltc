import express from "express";

import {

    listarEscalas,
    obtenerEscala,
    crearEscala,
    actualizarEscala,
    eliminarEscala

} from "../../controllers/evaluacion/evaluacionEscalaController.js";

const router = express.Router();

/*=========================================================
  CONSULTAS
=========================================================*/

router.get(
    "/",
    listarEscalas
);

router.get(
    "/:id",
    obtenerEscala
);

/*=========================================================
  ADMINISTRACIÓN
=========================================================*/

router.post(
    "/",
    crearEscala
);

router.put(
    "/:id",
    actualizarEscala
);

router.delete(
    "/:id",
    eliminarEscala
);

export default router;