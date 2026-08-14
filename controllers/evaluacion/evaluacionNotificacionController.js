import {

    obtenerConfiguracion,

    guardarConfiguracion

} from "../../services/evaluacion/evaluacionNotificacionService.js";

import {

    enviarMailPrueba

} from "../../services/evaluacion/evaluacionMailService.js";


/* ===========================================================
   OBTENER CONFIGURACIÓN
=========================================================== */

export const obtenerConfiguracionNotificaciones = async (req, res) => {

    try {

        const configuracion =

            await obtenerConfiguracion();

        res.json(configuracion);

    }
    catch (error) {

        console.error(error);

        res.status(500).json(error);

    }

};


/* ===========================================================
   GUARDAR CONFIGURACIÓN
=========================================================== */

export const guardarConfiguracionNotificaciones = async (req, res) => {

    try {

        const configuracion =

            await guardarConfiguracion(

                req.body

            );

        res.json(configuracion);

    }
    catch (error) {

        console.error(error);

        res.status(500).json(error);

    }

};


/* ===========================================================
   ENVIAR MAIL DE PRUEBA
=========================================================== */

export const enviarMailPruebaNotificaciones = async (req, res) => {

    try {

        await enviarMailPrueba();

        res.json({

            ok: true

        });

    }
    catch (error) {

        console.error(error);

        res.status(500).json(error);

    }

};