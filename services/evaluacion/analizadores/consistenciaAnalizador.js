import evaluacionAnalisisHelper
    from "../helpers/evaluacionAnalisisHelper.js";

import CONFIG
    from "../evaluacionAnalisisConfig.js";

import {

    EVENTOS_EVALUACION

} from "../evaluacionEventos.js";


const analizar = async (

    respuesta,

    evaluacion

) => {

    const respuestas =

        await evaluacionAnalisisHelper
            .obtenerRespuestasEvaluacion(

                evaluacion.id

            );

    const auto =

        respuestas.find(

            r => r.tipo_respuesta === "AUTO"

        );

    const supervisor =

        respuestas.find(

            r => r.tipo_respuesta === "SUPERVISOR"

        );

    if (

        !auto ||

        !supervisor

    ) {

        return [];

    }

    const diferencia =

        Math.abs(

            Number(

                auto.porcentaje

            )

            -

            Number(

                supervisor.porcentaje

            )

        );

    if (

        diferencia <

        CONFIG.UMBRALES
            .DIFERENCIA_CONSISTENCIA

    ) {

        return [];

    }

    return [

        {

            publicar: true,

            evento:

                EVENTOS_EVALUACION
                    .AUTOEVALUACION_DESALINEADA,

            nivel:

                "DESALINEADA",

            auto:

                Number(

                    auto.porcentaje

                ),

            supervisor:

                Number(

                    supervisor.porcentaje

                ),

            diferencia,
            riesgo:

                CONFIG.PUNTAJES_RIESGO
                    .AUTOEVALUACION_DESALINEADA,

            anterior: null,

            actual: null,

            diferencia: null

        }

    ];

};

export default {

    analizar

};