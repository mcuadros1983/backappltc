import { alertaAdvertenciaTemplate } from "./alertaAdvertenciaTemplate.js";

export const caidaRendimientoTemplate = (datos) => {

    return alertaAdvertenciaTemplate({

        titulo: "Caída de Rendimiento",

        descripcion:
            "Se detectó una disminución del rendimiento por debajo del límite establecido.",

        datos: {

            empleado: datos.empleado,

            dni: datos.dni,

            sucursal: datos.sucursal,

            evaluacion: datos.evaluacion,

            competencia: datos.competencia,

            kpi: datos.kpi,

            periodo: datos.periodo,

            supervisor: datos.supervisor,

            anterior: `${datos.anterior}%`,

            actual: `${datos.actual}%`,

            diferencia: datos.diferencia,

            nivel: datos.nivel

        },

        recomendaciones: [

            "Revisar la evolución del rendimiento.",

            "Analizar las posibles causas de la disminución.",

            "Coordinar un plan de mejora con el supervisor.",

            "Dar seguimiento en la próxima evaluación."

        ]

    });

};