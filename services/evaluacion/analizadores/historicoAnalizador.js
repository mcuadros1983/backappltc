import evaluacionAnalisisHelper
    from "../helpers/evaluacionAnalisisHelper.js";

import {
    EVENTOS_EVALUACION
} from "../evaluacionEventos.js";

const DIFERENCIA_MINIMA = 10;


/*=========================================================
ANALIZAR HISTORICO
=========================================================*/

const analizar = async (

    respuesta,

    evaluacion

) => {

    const historico =

        await evaluacionAnalisisHelper.obtenerHistorico(

            respuesta,

            evaluacion

        );

    if (!historico) {

        return [];

    }

    const actual = Number(

        respuesta.porcentaje || 0

    );

    const anterior = Number(

        historico.porcentaje || 0

    );

    const diferencia =

        actual - anterior;

    const eventos = [];

    if (

        diferencia <=

        -DIFERENCIA_MINIMA

    ) {

        eventos.push({

            publicar: true,

            evento:

                EVENTOS_EVALUACION.CAIDA_RENDIMIENTO,

            nivel: "CAIDA",

            riesgo:

                CONFIG.PUNTAJES_RIESGO
                    .CAIDA_RENDIMIENTO,

            anterior: null,

            actual: null,

            diferencia: null


        });

    }

    if (

        diferencia >=

        DIFERENCIA_MINIMA

    ) {

        eventos.push({

            publicar: true,

            evento:

                EVENTOS_EVALUACION.MEJORA_RENDIMIENTO,

            nivel: "MEJORA",

            riesgo: 0,

            anterior: null,

            actual: null,

            diferencia: null

        });

    }

    return eventos;

};

export default {

    analizar

};