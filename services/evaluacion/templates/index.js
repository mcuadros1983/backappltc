import {
    alertaRojaTemplate
} from "./alertaRojaTemplate.js";

import {
    banderaCriticaTemplate
} from "./banderaCriticaTemplate.js";

import {
    caidaRendimientoTemplate
} from "./caidaRendimientoTemplate.js";

import {
    bajaParticipacionTemplate
} from "./bajaParticipacionTemplate.js";

import {
    resumenSemanalTemplate
} from "./resumenSemanalTemplate.js";

import {
    resumenMensualTemplate
} from "./resumenMensualTemplate.js";

import {
    recordatorioSupervisionesTemplate
} from "./recordatorioSupervisionesTemplate.js";

import {
    dniNoReconocidoTemplate
} from "./dniNoReconocidoTemplate.js";

import {
    EVENTOS_EVALUACION
} from "../evaluacionEventos.js";

export const obtenerTemplateEvaluacion = (

    evento

) => {

    const templates = {

        // Alertas críticas

        [EVENTOS_EVALUACION.ALERTA_ROJA]:
            alertaRojaTemplate,

        [EVENTOS_EVALUACION.RIESGO_CRITICO]:
            alertaRojaTemplate,

        [EVENTOS_EVALUACION.COMPETENCIA_CRITICA]:
            alertaRojaTemplate,

        [EVENTOS_EVALUACION.SIN_CONSENSO]:
            alertaRojaTemplate,

        // Advertencias

        [EVENTOS_EVALUACION.BANDERA_CRITICA]:
            banderaCriticaTemplate,

        [EVENTOS_EVALUACION.RIESGO_ALTO]:
            banderaCriticaTemplate,

        [EVENTOS_EVALUACION.RIESGO_MEDIO]:
            banderaCriticaTemplate,

        [EVENTOS_EVALUACION.RIESGO_BAJO]:
            banderaCriticaTemplate,

        [EVENTOS_EVALUACION.AUTOEVALUACION_DESALINEADA]:
            banderaCriticaTemplate,

        [EVENTOS_EVALUACION.CONSENSO_EVALUACION]:
            banderaCriticaTemplate,

        // Rendimiento

        [EVENTOS_EVALUACION.CAIDA_RENDIMIENTO]:
            caidaRendimientoTemplate,

        [EVENTOS_EVALUACION.CAIDA_SOSTENIDA]:
            caidaRendimientoTemplate,

        [EVENTOS_EVALUACION.TENDENCIA_NEGATIVA]:
            caidaRendimientoTemplate,

        [EVENTOS_EVALUACION.MEJORA_RENDIMIENTO]:
            banderaCriticaTemplate,

        [EVENTOS_EVALUACION.MEJORA_SOSTENIDA]:
            banderaCriticaTemplate,

        [EVENTOS_EVALUACION.TENDENCIA_POSITIVA]:
            banderaCriticaTemplate,

        [EVENTOS_EVALUACION.ESTABILIDAD]:
            banderaCriticaTemplate,

        // Participación

        [EVENTOS_EVALUACION.BAJA_PARTICIPACION]:
            bajaParticipacionTemplate,

        // Resúmenes

        [EVENTOS_EVALUACION.RESUMEN_SEMANAL]:
            resumenSemanalTemplate,

        [EVENTOS_EVALUACION.RESUMEN_MENSUAL]:
            resumenMensualTemplate,

        // Recordatorios

        [EVENTOS_EVALUACION.RECORDATORIO_SUPERVISIONES]:
            recordatorioSupervisionesTemplate,

        // Validaciones

        [EVENTOS_EVALUACION.DNI_NO_RECONOCIDO]:
            dniNoReconocidoTemplate

    };

    return templates[evento] || null;

};