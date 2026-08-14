import EvaluacionNotificacion
    from "../../models/evaluacion/evaluacionNotificacionModel.js";

export const obtenerConfiguracion = async () => {

    const [

        configuracion

    ] = await EvaluacionNotificacion.findOrCreate({

        where: {

            id: 1

        },

        defaults: {

            id: 1

        }

    });

    return configuracion;

};

export const guardarConfiguracion = async (datos) => {

    const [

        configuracion

    ] = await EvaluacionNotificacion.findOrCreate({

        where: {

            id: 1

        },

        defaults: {

            id: 1

        }

    });

    await configuracion.update({

        mail_1: datos.mail_1,

        mail_2: datos.mail_2,

        mail_3: datos.mail_3,

        alerta_roja: datos.alerta_roja,

        bandera_critica: datos.bandera_critica,

        caida_rendimiento: datos.caida_rendimiento,

        resumen_semanal: datos.resumen_semanal,

        resumen_mensual: datos.resumen_mensual,

        recordatorio_supervisiones:
            datos.recordatorio_supervisiones,

        baja_participacion:
            datos.baja_participacion,

        dni_no_reconocido:
            datos.dni_no_reconocido,

        mejora_rendimiento:
            datos.mejora_rendimiento,

        competencia_critica:
            datos.competencia_critica,

        autoevaluacion_desalineada:
            datos.autoevaluacion_desalineada,

        caida_sostenida:
            datos.caida_sostenida,

        mejora_sostenida:
            datos.mejora_sostenida,

        tendencia_negativa:
            datos.tendencia_negativa,

        tendencia_positiva:
            datos.tendencia_positiva,

        estabilidad:
            datos.estabilidad,

        consenso_evaluacion:
            datos.consenso_evaluacion,

        riesgo_bajo:
            datos.riesgo_bajo,

        riesgo_medio:
            datos.riesgo_medio,

        riesgo_alto:
            datos.riesgo_alto,

        riesgo_critico:
            datos.riesgo_critico,

    });

    return configuracion;

};