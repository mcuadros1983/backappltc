import express from "express";

import {

    listarAsignaciones,
    obtenerAsignacion,
    crearAsignacion,
    actualizarAsignacion,
    eliminarAsignacion,

    asignarMeta,
    finalizarAsignacion,
    cancelarAsignacion

} from "../../controllers/evaluacion/metaAsignacionController.js";

const router = express.Router();

/*=========================================================
  ASIGNACIONES
=========================================================*/

router.get(

    "/",

    listarAsignaciones

);

router.get(

    "/:id",

    obtenerAsignacion

);

router.post(

    "/",

    crearAsignacion

);

router.put(

    "/:id",

    actualizarAsignacion

);

router.delete(

    "/:id",

    eliminarAsignacion

);

/*=========================================================
  ACCIONES
=========================================================*/

router.post(

    "/:id/asignar",

    asignarMeta

);

router.post(

    "/:id/finalizar",

    finalizarAsignacion

);

router.post(

    "/:id/cancelar",

    cancelarAsignacion

);

export default router;