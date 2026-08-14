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

    const respuestas =

        await evaluacionAnalisisHelper
            .obtenerRespuestasEvaluacion(

                respuesta.evaluacion_id

            );

    if (respuestas.length < 2) {

        return [];

    }

    const valores =

        respuestas.map(

            item => Number(item.porcentaje || 0)

        );

    const maximo = Math.max(...valores);

    const minimo = Math.min(...valores);

    const promedio =

        valores.reduce(

            (a,b)=>a+b,

            0

        ) / valores.length;

    const diferencia =

        maximo - minimo;

    /*
    ==========================================
    CONSENSO ALTO
    ==========================================
    */

    if (diferencia <= 5) {

        return [

            {

                publicar:true,

                evento:

                    EVENTOS_EVALUACION
                        .CONSENSO_ALTO,

                nivel:"ALTO",

                riesgo:0,

                anterior:minimo,

                actual:maximo,

                diferencia,

                promedio,

                evaluadores:

                    respuestas.length

            }

        ];

    }

    /*
    ==========================================
    CONSENSO MEDIO
    ==========================================
    */

    if (diferencia <= 10) {

        return [

            {

                publicar:true,

                evento:

                    EVENTOS_EVALUACION
                        .CONSENSO_MEDIO,

                nivel:"MEDIO",

                riesgo:0,

                anterior:minimo,

                actual:maximo,

                diferencia,

                promedio,

                evaluadores:

                    respuestas.length

            }

        ];

    }

    /*
    ==========================================
    CONSENSO BAJO
    ==========================================
    */

    if (diferencia <= 20) {

        return [

            {

                publicar:true,

                evento:

                    EVENTOS_EVALUACION
                        .CONSENSO_BAJO,

                nivel:"BAJO",

                riesgo:

                    CONFIG.PUNTAJES_RIESGO
                        .AUTOEVALUACION_DESALINEADA,

                anterior:minimo,

                actual:maximo,

                diferencia,

                promedio,

                evaluadores:

                    respuestas.length

            }

        ];

    }

    /*
    ==========================================
    SIN CONSENSO
    ==========================================
    */

    return [

        {

            publicar:true,

            evento:

                EVENTOS_EVALUACION
                    .SIN_CONSENSO,

            nivel:"CRITICO",

            riesgo:

                CONFIG.PUNTAJES_RIESGO
                    .AUTOEVALUACION_DESALINEADA,

            anterior:minimo,

            actual:maximo,

            diferencia,

            promedio,

            evaluadores:

                respuestas.length

        }

    ];

};

export default{

    analizar

};