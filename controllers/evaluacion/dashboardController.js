import { fn, col, literal, Op } from "sequelize";

import Evaluacion from "../../models/evaluacion/evaluacionModel.js";
import EvaluacionTipo from "../../models/evaluacion/evaluacionTipoModel.js";
import EvaluacionPeriodo from "../../models/evaluacion/evaluacionPeriodoModel.js";
import EmpleadoTabla from "../../models/tablas/empleadoModel.js";


import EvaluacionPlantilla from "../../models/evaluacion/evaluacionPlantillaModel.js";

import EvaluacionPlantillaDetalle from "../../models/evaluacion/evaluacionPlantillaDetalleModel.js";

import {
    obtenerCampanias,

    obtenerIndicadores,

    obtenerUltimasRespuestas,

    obtenerRanking,

    obtenerPromedioTipos,

    obtenerPromedioPeriodos,

    obtenerFrecuenciaEsperada,

    obtenerCumplimientoEsperado,

    obtenerBrechasEsperadas

} from "../../services/evaluacion/dashboardService.js";

import EvaluacionMeta
    from "../../models/evaluacion/evaluacionModel.js";

import EvaluacionRespuesta
    from "../../models/evaluacion/evaluacionRespuestaModel.js";


export const obtenerResumenDashboard = async (req, res) => {

    try {

        // console.log("dias transcurridos", req)

        const [

            indicadores,

            ultimas,

            ranking,

            tipos,

            periodos,

            campanias,

            frecuencias,

            cumplimiento,
            brechas

        ] = await Promise.all([

            obtenerIndicadores(),

            obtenerUltimasRespuestas(),

            obtenerRanking(),

            obtenerPromedioTipos(),

            obtenerPromedioPeriodos(),

            obtenerCampanias(),

            obtenerFrecuenciaEsperada(),

            obtenerCumplimientoEsperado(),
            obtenerBrechasEsperadas()

        ]);

        res.json({

            indicadores,

            ultimas,

            ranking,

            tipos,

            periodos,

            campanias,

            frecuencias,

            cumplimiento,
            brechas

        });

    }

    catch (error) {

        console.error(error);

        res.status(500).json({

            message:

                "Error obteniendo el dashboard.",

            error:

                error.message

        });

    }

};

/*=========================================================
  AVISOS DEL SISTEMA
=========================================================*/

export const obtenerAvisos = async (req, res) => {

    try {

        const avisos = [];

        /*=========================================
          EVALUACIONES PENDIENTES
        =========================================*/

        const pendientes =
            await Evaluacion.findAll({

                where: {

                    estado: "PENDIENTE"

                },

                order: [

                    ["fecha", "DESC"]

                ]

            });

        pendientes.forEach(item => {

            avisos.push({

                tipo: "EVALUACION_PENDIENTE",

                prioridad: "ALTA",

                fecha: item.fecha,

                estado: item.estado,

                referencia: item.numero,

                mensaje:

                    `La evaluación ${item.numero} continúa pendiente.`

            });

        });

        /*=========================================
          EVALUACIONES ANULADAS
        =========================================*/

        const anuladas =
            await Evaluacion.findAll({

                where: {

                    estado: "ANULADA"

                },

                order: [

                    ["fecha", "DESC"]

                ]

            });

        anuladas.forEach(item => {

            avisos.push({
                id: item.id,

                tipo: "EVALUACION_ANULADA",

                prioridad: "MEDIA",

                fecha: item.fecha,

                estado: item.estado,

                referencia: item.numero,

                mensaje:

                    `La evaluación ${item.numero} fue anulada.`

            });

        });

        /*=========================================
          EVALUACIONES FINALIZADAS
        =========================================*/

        const finalizadas =
            await Evaluacion.findAll({

                where: {

                    estado: "FINALIZADA"

                },

                order: [

                    ["updatedAt", "DESC"]

                ],

                limit: 10

            });

        finalizadas.forEach(item => {

            avisos.push({

                tipo: "EVALUACION_FINALIZADA",

                prioridad: "BAJA",

                fecha: item.updatedAt,

                estado: item.estado,

                referencia: item.numero,

                mensaje:

                    `La evaluación ${item.numero} fue finalizada.`

            });

        });

        /*=========================================
          PLANTILLAS SIN CRITERIOS
        =========================================*/

        const plantillas =
            await EvaluacionPlantilla.findAll({

                include: [

                    {

                        model: EvaluacionPlantillaDetalle,

                        as: "detalles",

                        required: false

                    }

                ]

            });

        plantillas.forEach(item => {

            if (

                !item.detalles ||

                item.detalles.length === 0

            ) {

                avisos.push({

                    tipo: "PLANTILLA_INCOMPLETA",

                    prioridad: "ALTA",

                    fecha: item.createdAt,

                    estado: "CONFIGURACION",

                    referencia: item.descripcion,

                    mensaje:

                        `La plantilla ${item.descripcion} no tiene criterios configurados.`

                });

            }

        });

        /*=========================================
          PERIODOS PROXIMOS A FINALIZAR
        =========================================*/

        const hoy = new Date();

        const sieteDias = new Date();

        sieteDias.setDate(

            hoy.getDate() + 7

        );

        const periodos =
            await EvaluacionPeriodo.findAll({

                where: {

                    fecha_fin: {

                        [Op.between]: [

                            hoy,

                            sieteDias

                        ]

                    }

                }

            });

        periodos.forEach(item => {

            avisos.push({

                tipo: "PERIODO_POR_VENCER",

                prioridad: "MEDIA",

                fecha: item.fecha_fin,

                estado: "VIGENTE",

                referencia: item.descripcion,

                mensaje:

                    `El período ${item.descripcion} finaliza próximamente.`

            });

        });

        /*=========================================
ALERTAS DE FRECUENCIA, CUMPLIMIENTO Y BRECHAS
=========================================*/

        const [

            frecuencias,

            cumplimiento,

            brechas

        ] = await Promise.all([

            obtenerFrecuenciaEsperada(),

            obtenerCumplimientoEsperado(),

            obtenerBrechasEsperadas()

        ]);

        frecuencias.items

            .filter(item =>

                item.estado !== "VIGENTE"

            )

            .forEach(item => {

                avisos.push({

                    id:

                        `FRECUENCIA_${item.empleado_id}_${item.tipo}`,

                    empleado_id:

                        item.empleado_id,

                    tipo:

                        item.estado === "VENCIDA"

                            ? "FRECUENCIA_BAJA"

                            : "FRECUENCIA_PROXIMA",

                    categoria:

                        "FRECUENCIA",

                    prioridad:

                        item.estado === "VENCIDA"

                            ? "ALTA"

                            : "MEDIA",

                    fecha:

                        item.ultima_fecha || new Date(),

                    estado:

                        item.estado,

                    referencia:

                        item.empleado,

                    mensaje:

                        item.ultima_fecha

                            ? `${item.empleado}: ${item.tipo} registra ${item.dias_transcurridos} días desde la última respuesta; la frecuencia esperada es de ${item.frecuencia_esperada} días.`

                            : `${item.empleado}: no registra respuestas de tipo ${item.tipo}.`,

                    detalle: {

                        capa:

                            item.tipo,

                        ultima_fecha:

                            item.ultima_fecha,

                        dias_transcurridos:

                            item.dias_transcurridos,

                        frecuencia_esperada:

                            item.frecuencia_esperada

                    }

                });

            });

        cumplimiento.items

            .filter(item =>

                item.estado !== "CUMPLE"

            )

            .forEach(item => {

                avisos.push({

                    id:

                        `CUMPLIMIENTO_${item.empleado_id}_${item.tipo}`,

                    empleado_id:

                        item.empleado_id,

                    tipo:

                        "CUMPLIMIENTO_BAJO",

                    categoria:

                        "CUMPLIMIENTO",

                    prioridad:

                        item.estado === "NO_CUMPLE"

                            ? "ALTA"

                            : "MEDIA",

                    fecha:

                        new Date(),

                    estado:

                        item.estado,

                    referencia:

                        item.empleado,

                    mensaje:

                        `${item.empleado}: el promedio de ${item.tipo} es ${Number(

                            item.promedio || 0

                        ).toFixed(2)} %, con un mínimo esperado de ${Number(

                            item.minimo || 0

                        ).toFixed(2)} %.`,

                    detalle: {

                        capa:

                            item.tipo,

                        promedio:

                            item.promedio,

                        minimo:

                            item.minimo

                    }

                });

            });

        brechas.items

            .filter(item =>

                item.estado !== "CORRECTA"

            )

            .forEach(item => {

                avisos.push({

                    id:

                        `BRECHA_${item.empleado_id}_${String(

                            item.comparacion

                        ).replace(/\s/g, "_")}`,

                    empleado_id:

                        item.empleado_id,

                    tipo:

                        "BRECHA_CRITICA",

                    categoria:

                        "BRECHA",

                    prioridad:

                        item.estado === "FUERA_RANGO"

                            ? "ALTA"

                            : "MEDIA",

                    fecha:

                        new Date(),

                    estado:

                        item.estado,

                    referencia:

                        item.empleado,

                    mensaje:

                        `${item.empleado}: la brecha ${item.comparacion} es de ${Number(

                            item.diferencia || 0

                        ).toFixed(2)} puntos; el máximo permitido es ${Number(

                            item.maxima || 0

                        ).toFixed(2)} puntos.`,

                    detalle: {

                        comparacion:

                            item.comparacion,

                        diferencia:

                            item.diferencia,

                        maxima:

                            item.maxima

                    }

                });

            });

        /*=========================================
          ORDENAR
        =========================================*/

        avisos.sort(

            (a, b) =>

                new Date(b.fecha) -

                new Date(a.fecha)

        );

        res.json({

            kpis: {

                pendientes:

                    pendientes.length,

                finalizadas:

                    finalizadas.length,

                periodos:

                    periodos.length,

                plantillas:

                    plantillas.filter(

                        p =>

                            !p.detalles ||

                            p.detalles.length === 0

                    ).length,

                frecuencia:

                    frecuencias.vencidas +

                    frecuencias.proximas,

                cumplimiento:

                    cumplimiento.incumplen +

                    cumplimiento.riesgo,

                brechas:

                    brechas.fueraRango +

                    brechas.riesgo

            },

            avisos

        });

    } catch (error) {

        console.error(error);

        res.status(500).json({

            message:

                "Error obteniendo los avisos."

        });

    }

};

/*==========================================================
RESPUESTAS INDEXADAS
==========================================================*/

