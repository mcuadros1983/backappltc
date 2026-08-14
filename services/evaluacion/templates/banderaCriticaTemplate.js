import { alertaAdvertenciaTemplate } from "./alertaAdvertenciaTemplate.js";

export const banderaCriticaTemplate = (datos) => {

    return alertaAdvertenciaTemplate({

        titulo: "Bandera Crítica Detectada",

        descripcion:
            "Se detectó una condición que requiere atención y seguimiento.",

        datos: {

            empleado: datos.empleado,

            dni: datos.dni,

            sucursal: datos.sucursal,

            evaluacion: datos.evaluacion,

            competencia: datos.competencia,

            indicador: datos.detalle,

            periodo: datos.periodo,

            supervisor: datos.supervisor,

            nivel: "CRÍTICO"

        },

        recomendaciones: [

            "Revisar la condición detectada.",

            "Validar la información registrada.",

            "Coordinar seguimiento con el supervisor.",

            "Monitorear la evolución del colaborador."

        ]

    });

};