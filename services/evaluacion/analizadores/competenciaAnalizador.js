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

    const detalle =

        await evaluacionAnalisisHelper

            .obtenerDetalleRespuesta(

                respuesta.id

            );

    const eventos = [];

    for (

        const criterio

        of detalle

    ) {

        if (

            Number(

                criterio.valor

            ) >=

            CONFIG.UMBRALES

                .COMPETENCIA_CRITICA

        ) {

            continue;

        }

        eventos.push({

            publicar: true,

            evento:

                EVENTOS_EVALUACION

                    .COMPETENCIA_CRITICA,

            nivel:

                "CRITICA",

            criterioId:

                criterio.criterio_id,

            valor:

                Number(

                    criterio.valor

                ),
            riesgo:

                CONFIG.PUNTAJES_RIESGO
                    .CAIDA_RENDIMIENTO,

            anterior: null,

            actual: null,

            diferencia: null,

        });

    }

    return eventos;

};

export default {

    analizar

};