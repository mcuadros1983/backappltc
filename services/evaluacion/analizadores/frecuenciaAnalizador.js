import evaluacionAnalisisHelper
    from "../helpers/evaluacionAnalisisHelper.js";

import CONFIG
    from "../evaluacionAnalisisConfig.js";

import {
    EVENTOS_EVALUACION
} from "../evaluacionEventos.js";


const analizar = async (

    respuesta

) => {

    const total =

        await evaluacionAnalisisHelper
            .contarRespuestasEmpleado(

                respuesta.empleado_id

            );

    if (

        total >=

        CONFIG.UMBRALES.MIN_RESPUESTAS_HISTORICAS

    ) {

        return [];

    }

    return [

        {

            publicar: true,

            evento:

                EVENTOS_EVALUACION.BAJA_PARTICIPACION,

            nivel:

                "BAJA_PARTICIPACION",

            totalRespuestas:

                total,
            riesgo:

                CONFIG.PUNTAJES_RIESGO
                    .BAJA_PARTICIPACION,

            anterior: null,

            actual: null,

            diferencia: null

        }

    ];

};

export default {

    analizar

};