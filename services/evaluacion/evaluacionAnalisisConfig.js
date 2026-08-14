/*=========================================================
CONFIGURACIÓN DEL MOTOR DE ANÁLISIS
=========================================================*/

export const EVALUACION_ANALISIS_CONFIG = {

    UMBRALES: {

        ALERTA_ROJA: 60,

        BANDERA_CRITICA: 75,

        CAIDA_RENDIMIENTO: 10,

        MEJORA_RENDIMIENTO: 10,

        MIN_RESPUESTAS_HISTORICAS: 3,

        COMPETENCIA_CRITICA: 60,
        DIFERENCIA_CONSISTENCIA: 20



    },

    NIVELES: {

        NORMAL: "NORMAL",

        BANDERA_CRITICA: "BANDERA_CRITICA",

        ALERTA_ROJA: "ALERTA_ROJA",

        CAIDA: "CAIDA",

        MEJORA: "MEJORA"

    },

    PUNTAJES_RIESGO: {

        ALERTA_ROJA: 40,

        BANDERA_CRITICA: 20,

        COMPETENCIA_CRITICA: 20,

        CAIDA_RENDIMIENTO: 20,

        AUTOEVALUACION_DESALINEADA: 10,

        BAJA_PARTICIPACION: 10

    },

    UMBRALES_RIESGO: {

        BAJO: 20,

        MEDIO: 40,

        ALTO: 60,

        CRITICO: 80

    },

    TENDENCIAS: {

        MIN_REGISTROS: 5,

        DIFERENCIA_MINIMA: 5,

        ESTABILIDAD: 3

    },

    CONSENSO: {

        ALTO: 5,

        MEDIO: 10,

        BAJO: 20

    }

};

export default EVALUACION_ANALISIS_CONFIG;