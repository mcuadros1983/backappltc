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

    const historico =

        await evaluacionAnalisisHelper
            .obtenerSerieHistorica(

                respuesta.empleado_id,

                respuesta.tipo_respuesta,

                evaluacion.tipo_id,

                evaluacion.plantilla_id,

                CONFIG.TENDENCIAS.MIN_REGISTROS

            );

    if (

        historico.length <

        CONFIG.TENDENCIAS.MIN_REGISTROS

    ) {

        return [];

    }

    const primero =

        Number(

            historico[0].porcentaje

        );

    const ultimo =

        Number(

            historico[historico.length - 1].porcentaje

        );

    const diferencia =

        ultimo - primero;

    const valores =

        historico.map(

            item => Number(item.porcentaje)

        );

    const ascendente =

        valores.every(

            (valor, indice) =>

                indice === 0 ||

                valor >= valores[indice - 1]

        );

    const descendente =

        valores.every(

            (valor, indice) =>

                indice === 0 ||

                valor <= valores[indice - 1]

        );

    /*
    ===========================================
    ESTABILIDAD
    ===========================================
    */

    if (

        Math.abs(diferencia) <=

        CONFIG.TENDENCIAS.ESTABILIDAD

    ) {

        return [

            {

                publicar: true,

                evento:

                    EVENTOS_EVALUACION
                        .ESTABILIDAD,

                nivel: "ESTABLE",

                riesgo: 0,

                anterior: primero,

                actual: ultimo,

                diferencia,

                registros: historico.length

            }

        ];

    }

    /*
    ===========================================
    MEJORA SOSTENIDA
    ===========================================
    */

    if (

        ascendente &&

        diferencia >=

        CONFIG.TENDENCIAS.DIFERENCIA_MINIMA

    ) {

        return [

            {

                publicar: true,

                evento:

                    EVENTOS_EVALUACION
                        .MEJORA_SOSTENIDA,

                nivel: "POSITIVA",

                riesgo: 0,

                anterior: primero,

                actual: ultimo,

                diferencia,

                registros: historico.length

            }

        ];

    }

    /*
    ===========================================
    CAIDA SOSTENIDA
    ===========================================
    */

    if (

        descendente &&

        Math.abs(diferencia) >=

        CONFIG.TENDENCIAS.DIFERENCIA_MINIMA

    ) {

        return [

            {

                publicar: true,

                evento:

                    EVENTOS_EVALUACION
                        .CAIDA_SOSTENIDA,

                nivel: "NEGATIVA",

                riesgo:

                    CONFIG.PUNTAJES_RIESGO
                        .CAIDA_RENDIMIENTO,

                anterior: primero,

                actual: ultimo,

                diferencia,

                registros: historico.length

            }

        ];

    }

    /*
    ===========================================
    TENDENCIA POSITIVA
    ===========================================
    */

    if (

        diferencia >=

        CONFIG.TENDENCIAS.DIFERENCIA_MINIMA

    ) {

        return [

            {

                publicar: true,

                evento:

                    EVENTOS_EVALUACION
                        .TENDENCIA_POSITIVA,

                nivel: "POSITIVA",

                riesgo: 0,

                anterior: primero,

                actual: ultimo,

                diferencia,

                registros: historico.length

            }

        ];

    }

    /*
    ===========================================
    TENDENCIA NEGATIVA
    ===========================================
    */

    if (

        diferencia <=

        -CONFIG.TENDENCIAS.DIFERENCIA_MINIMA

    ) {

        return [

            {

                publicar: true,

                evento:

                    EVENTOS_EVALUACION
                        .TENDENCIA_NEGATIVA,

                nivel: "NEGATIVA",

                riesgo:

                    CONFIG.PUNTAJES_RIESGO
                        .CAIDA_RENDIMIENTO,

                anterior: primero,

                actual: ultimo,

                diferencia,

                registros: historico.length

            }

        ];

    }

    return [];

};

export default {

    analizar

};