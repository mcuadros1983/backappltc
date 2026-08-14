import CONFIG
    from "../evaluacionAnalisisConfig.js";

import {

    EVENTOS_EVALUACION

} from "../evaluacionEventos.js";

const analizar = (

    resultados = []

) => {

    const puntaje =

        resultados.reduce(

            (

                total,

                resultado

            ) =>

                total +

                Number(

                    resultado.riesgo || 0

                ),

            0

        );

    let evento =

        EVENTOS_EVALUACION
            .RIESGO_BAJO;

    let nivel = "BAJO";

    if (

        puntaje >=

        CONFIG.UMBRALES_RIESGO.CRITICO

    ) {

        evento =

            EVENTOS_EVALUACION
                .RIESGO_CRITICO;

        nivel = "CRITICO";

    }

    else if (

        puntaje >=

        CONFIG.UMBRALES_RIESGO.ALTO

    ) {

        evento =

            EVENTOS_EVALUACION
                .RIESGO_ALTO;

        nivel = "ALTO";

    }

    else if (

        puntaje >=

        CONFIG.UMBRALES_RIESGO.MEDIO

    ) {

        evento =

            EVENTOS_EVALUACION
                .RIESGO_MEDIO;

        nivel = "MEDIO";

    }

    return [

        {

            publicar: true,

            evento,

            nivel,

            riesgo: puntaje,

            anterior: null,

            actual: null,

            diferencia: null

        }

    ];

};

export default {

    analizar

};