import express from "express";

import {

    obtenerConfiguracionNotificaciones,

    guardarConfiguracionNotificaciones,

    enviarMailPruebaNotificaciones

} from "../../controllers/evaluacion/evaluacionNotificacionController.js";

const router = express.Router();

router.get(

    "/",

    obtenerConfiguracionNotificaciones

);

router.put(

    "/",

    guardarConfiguracionNotificaciones

);

router.post(

    "/mail-prueba",

    enviarMailPruebaNotificaciones

);

export default router;