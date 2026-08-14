import {
    enviarAlerta
} from "./evaluacionMailService.js";

import {
    EVENTOS_EVALUACION
} from "./evaluacionEventos.js";

const eventosConNotificacion = new Set([

    EVENTOS_EVALUACION.ALERTA_ROJA,

    EVENTOS_EVALUACION.BANDERA_CRITICA,

    EVENTOS_EVALUACION.CAIDA_RENDIMIENTO,

    EVENTOS_EVALUACION.RESUMEN_SEMANAL,

    EVENTOS_EVALUACION.RESUMEN_MENSUAL,

    EVENTOS_EVALUACION.RECORDATORIO_SUPERVISIONES,

    EVENTOS_EVALUACION.BAJA_PARTICIPACION,

    EVENTOS_EVALUACION.DNI_NO_RECONOCIDO

]);

export const procesarEventoEvaluacion = async (

    evento

) => {

    if (!evento) {

        throw new Error(

            "El evento de Evaluación es obligatorio."

        );

    }

    const {

        codigo,

        datos = {}

    } = evento;

    if (

        !eventosConNotificacion.has(codigo)

    ) {

        return {

            procesado: false,

            motivo:
                "EVENTO_NO_NOTIFICABLE"

        };

    }

    const resultado =
        await enviarAlerta(

            codigo,

            datos

        );

    return {

        procesado: true,

        ...resultado

    };

};