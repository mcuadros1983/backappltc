import { alertaCriticaTemplate } from "./alertaCriticaTemplate.js";

export const alertaRojaTemplate = (datos) => {

    return alertaCriticaTemplate({

        titulo: "Alerta Roja - Evaluación",

        descripcion:
            "Se detectó una situación crítica durante el proceso de evaluación. Se recomienda revisar el caso de forma inmediata.",

        datos: {

            empleado: datos.empleado,

            dni: datos.dni,

            sucursal: datos.sucursal,

            evaluacion: datos.evaluacion,

            periodo: datos.periodo,

            supervisor: datos.supervisor,

            riesgo: "CRÍTICO",

            indicador: datos.motivo

        },

        recomendaciones: [

            "Revisar inmediatamente la evaluación.",

            "Contactar al supervisor responsable.",

            "Validar la información registrada.",

            "Dar seguimiento al caso."

        ]

    });

};