import {
    enviarAlerta
} from "../evaluacionMailService.js";

import EvaluacionRespuesta from "../../../models/evaluacion/evaluacionRespuestaModel.js";
import Evaluacion from "../../../models/evaluacion/evaluacionModel.js";
import EmpleadoTabla from "../../../models/tablas/empleadoModel.js";
import DatosEmpleado from "../../../models/tablas/datosEmpleadoModel.js";
import Sucursal from "../../../models/gmedias/sucursalModel.js";
import EvaluacionPeriodo from "../../../models/evaluacion/evaluacionPeriodoModel.js";
import EvaluacionTipo from "../../../models/evaluacion/evaluacionTipoModel.js";
import EvaluacionPlantilla from "../../../models/evaluacion/evaluacionPlantillaModel.js";


const obtenerContextoCorreo = async (datos = {}) => {

    if (!datos.respuestaId) {
        return datos;
    }

    const respuesta = await EvaluacionRespuesta.findByPk(
        datos.respuestaId,
        {
            include: [
                {
                    model: Evaluacion,
                    as: "evaluacion",
                    include: [
                        {
                            model: EmpleadoTabla,
                            as: "empleado",
                            include: [
                                {
                                    model: DatosEmpleado,
                                    as: "datos",
                                    include: [
                                        {
                                            model: Sucursal,
                                            as: "sucursal"
                                        }
                                    ]
                                }
                            ]
                        },
                        {
                            model: EvaluacionPeriodo,
                            as: "periodo"
                        },
                        {
                            model: EvaluacionTipo,
                            as: "tipo"
                        },
                        {
                            model: EvaluacionPlantilla,
                            as: "plantilla"
                        }
                    ]
                }
            ]
        }
    );

    if (!respuesta) {
        return datos;
    }

    const evaluacion = respuesta.evaluacion;
    const empleado = evaluacion?.empleado;
    const datosEmpleado = empleado?.datos;
    const sucursal = datosEmpleado?.sucursal;

    return {
        ...datos,

        empleado: empleado
            ? `${empleado.nombre ?? ""} ${empleado.apellido ?? ""}`.trim()
            : null,

        numeroEmpleado: empleado?.numero ?? null,

        sucursal: sucursal?.nombre ?? null,

        periodo: evaluacion?.periodo?.descripcion ?? null,

        tipo: evaluacion?.tipo?.descripcion ?? null,

        plantilla: evaluacion?.plantilla?.descripcion ?? null
    };

};

const EVENTOS = new Set([
    "ALERTA_ROJA",
    "BANDERA_CRITICA",
    "CAIDA_RENDIMIENTO",
    "MEJORA_RENDIMIENTO",
    "COMPETENCIA_CRITICA",
    "AUTOEVALUACION_DESALINEADA",
    "CAIDA_SOSTENIDA",
    "MEJORA_SOSTENIDA",
    "TENDENCIA_NEGATIVA",
    "TENDENCIA_POSITIVA",
    "ESTABILIDAD",
    "SIN_CONSENSO",
    "CONSENSO_BAJO",
    "CONSENSO_MEDIO",
    "CONSENSO_ALTO",
    "RIESGO_BAJO",
    "RIESGO_MEDIO",
    "RIESGO_ALTO",
    "RIESGO_CRITICO",
    "BAJA_PARTICIPACION",
    "RESUMEN_SEMANAL",
    "RESUMEN_MENSUAL",
    "RECORDATORIO_SUPERVISIONES",
    "DNI_NO_RECONOCIDO"
]);

const process = async (evento) => {

    try {

        if (!evento || !evento.codigo) {
            return;
        }

        if (!EVENTOS.has(evento.codigo)) {
            return;
        }

        const contexto = await obtenerContextoCorreo(
            evento.datos || {}
        );

        await enviarAlerta(
            evento.codigo,
            contexto
        );

    } catch (error) {

        console.error(
            `[Evaluación][MailSubscriber] Error procesando el evento ${evento?.codigo}`,
            error
        );

    }

};

export default {
    process
};