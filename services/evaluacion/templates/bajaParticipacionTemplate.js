import { alertaAdvertenciaTemplate } from "./alertaAdvertenciaTemplate.js";

export const bajaParticipacionTemplate = (datos) => {

    return alertaAdvertenciaTemplate({

        titulo: "Baja Participación en Evaluaciones",

        descripcion:
            "El sistema detectó una baja participación en el proceso de evaluación.",

        datos: {

            sucursal: datos.sucursal,

            indicador: datos.proceso,

            actual: `${datos.participacion ?? 0}%`,

            anterior: `${datos.esperada ?? 0}%`,

            diferencia: datos.pendientes,

            nivel: "BAJA PARTICIPACIÓN"

        },

        recomendaciones: [

            "Revisar el avance del proceso de evaluación.",

            "Contactar a los evaluadores pendientes.",

            "Realizar seguimiento a las evaluaciones no completadas.",

            "Verificar el cumplimiento del cronograma."

        ]

    });

};