import eventService from "../events/eventService.js";

import {
    EVENTOS_EVALUACION
} from "./evaluacionEventos.js";

import resultadoAnalizador
    from "./analizadores/resultadoAnalizador.js";

import frecuenciaAnalizador
    from "./analizadores/frecuenciaAnalizador.js";

import historicoAnalizador
    from "./analizadores/historicoAnalizador.js";

import evaluacionAnalisisHelper
    from "./helpers/evaluacionAnalisisHelper.js";

import competenciaAnalizador
    from "./analizadores/competenciaAnalizador.js";


import consistenciaAnalizador
    from "./analizadores/consistenciaAnalizador.js";

import riesgoAnalizador
    from "./analizadores/riesgoAnalizador.js";

import tendenciaAnalizador
    from "./analizadores/tendenciaAnalizador.js";

/*=========================================================
PUBLICAR EVENTO
=========================================================*/

const publicarEvento = async (

    codigo,

    datos = {}

) => {

    await eventService.publish({

        codigo,

        datos

    });

};

/*=========================================================
OBTENER RESPUESTAS EVALUACION
=========================================================*/

const obtenerRespuestasEvaluacion = async (

    evaluacionId

) => {

    return await EvaluacionRespuesta.findAll({

        where: {

            evaluacion_id:

                evaluacionId,

            estado:

                "FINALIZADA"

        }

    });

};


/*=========================================================
ANALIZAR RESPUESTA
=========================================================*/

const analizarRespuesta = async (

    respuestaId

) => {

    const respuesta =

        await evaluacionAnalisisHelper.obtenerRespuesta(

            respuestaId

        );

    const evaluacion =

        await evaluacionAnalisisHelper.obtenerEvaluacion(

            respuesta.evaluacion_id

        );

    const resultados = [

        ...await tendenciaAnalizador.analizar(

            respuesta,

            evaluacion

        ),

        ...resultadoAnalizador.analizar(

            respuesta.porcentaje

        ),

        ...await frecuenciaAnalizador.analizar(

            respuesta,

            evaluacion

        ),

        ...await historicoAnalizador.analizar(

            respuesta,

            evaluacion

        ),

        ...await competenciaAnalizador.analizar(

            respuesta,

            evaluacion

        ),

        ...await consistenciaAnalizador.analizar(

            respuesta,

            evaluacion

        )

    ];

    const resultadosRiesgo =

        riesgoAnalizador.analizar(

            resultados

        );

    resultados.push(

        ...resultadosRiesgo

    );

    for (

        const resultado

        of resultados

    ) {

        if (

            !resultado.publicar

        ) {

            continue;

        }

        await publicarEvento(

            resultado.evento,

            {

                respuestaId:

                    respuesta.id,

                evaluacionId:

                    evaluacion.id,

                empleadoId:

                    respuesta.empleado_id,

                evaluadorId:

                    respuesta.evaluador_id,

                tipoRespuesta:

                    respuesta.tipo_respuesta,

                porcentaje:

                    Number(

                        respuesta.porcentaje || 0

                    ),

                puntaje:

                    Number(

                        respuesta.puntaje_total || 0

                    ),

                nivel:

                    resultado.nivel,

                riesgo:

                    resultado.riesgo ?? null,

                anterior:

                    resultado.anterior ?? null,

                actual:

                    resultado.actual ?? null,

                diferencia:

                    resultado.diferencia ?? null

            }

        );

    }
    return {

        respuesta,

        evaluacion,

        resultados

    };

};


export default {

    analizarRespuesta,
    obtenerRespuestasEvaluacion,
    publicarEvento

};