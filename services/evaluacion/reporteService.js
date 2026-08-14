import { Op, fn, col } from "sequelize";

import Evaluacion from "../../models/evaluacion/evaluacionModel.js";
import EvaluacionTipo from "../../models/evaluacion/evaluacionTipoModel.js";
import EvaluacionPeriodo from "../../models/evaluacion/evaluacionPeriodoModel.js";
import EvaluacionRespuesta from "../../models/evaluacion/evaluacionRespuestaModel.js";

// import { fn, col } from "sequelize";

import EvaluacionRespuestaDetalle from "../../models/evaluacion/evaluacionRespuestaDetalleModel.js";
import EvaluacionCriterio from "../../models/evaluacion/evaluacionCriterioModel.js";

export const obtenerReporteCampanias = async (filtros = {}) => {

    const {

        numero,

        tipo,

        periodo,

        estado,

        fechaDesde,

        fechaHasta

    } = filtros;

    const where = {};

    if (numero) {

        where.numero = {

            [Op.iLike]: `%${numero}%`

        };

    }

    if (tipo) {

        where.tipo_id = tipo;

    }

    if (periodo) {

        where.periodo_id = periodo;

    }

    if (estado) {

        where.estado = estado;

    }

    if (fechaDesde || fechaHasta) {

        where.fecha_inicio = {};

        if (fechaDesde) {

            where.fecha_inicio[Op.gte] = fechaDesde;

        }

        if (fechaHasta) {

            where.fecha_inicio[Op.lte] = fechaHasta;

        }

    }

    const evaluaciones = await Evaluacion.findAll({

        where,

        include: [

            {

                model: EvaluacionTipo,

                as: "tipo",

                attributes: [

                    "id",

                    "descripcion"

                ]

            },

            {

                model: EvaluacionPeriodo,

                as: "periodo",

                attributes: [

                    "id",

                    "descripcion"

                ]

            },

            {

                model: EvaluacionRespuesta,

                as: "respuestas",

                attributes: [

                    "id",

                    "porcentaje"

                ],

                required: false

            }

        ],

        order: [

            [

                "fecha_inicio",

                "DESC"

            ],

            [

                "numero",

                "DESC"

            ]

        ]

    });

    const items = evaluaciones.map(evaluacion => {

        const respuestas =
            evaluacion.respuestas || [];

        const cantidad =
            respuestas.length;

        const promedio =
            cantidad === 0
                ? 0
                : respuestas.reduce(
                    (total, respuesta) =>
                        total +
                        Number(
                            respuesta.porcentaje
                        ),
                    0
                ) / cantidad;

        return {

            id:
                evaluacion.id,

            numero:
                evaluacion.numero,

            estado:
                evaluacion.estado,

            fecha_inicio:
                evaluacion.fecha_inicio,

            fecha_fin:
                evaluacion.fecha_fin,

            tipo:
                evaluacion.tipo,

            periodo:
                evaluacion.periodo,

            respuestas:
                cantidad,

            promedio:
                Number(
                    promedio
                ).toFixed(2)

        };

    });

    /*=========================================
    TOTALES
    =========================================*/

    const totales = {

        evaluaciones:
            items.length,

        pendientes:
            items.filter(
                item =>
                    item.estado !== "FINALIZADA"
            ).length,

        finalizadas:
            items.filter(
                item =>
                    item.estado === "FINALIZADA"
            ).length,

        promedio:
            items.length === 0
                ? "0.00"
                : (
                    items.reduce(
                        (total, item) =>
                            total +
                            Number(
                                item.promedio
                            ),
                        0
                    ) / items.length
                ).toFixed(2)

    };

    /*=========================================
    TIPOS
    =========================================*/

    const mapaTipos = new Map();

    items.forEach(item => {

        const descripcion =
            item.tipo?.descripcion ||
            "Sin tipo";

        if (
            !mapaTipos.has(
                descripcion
            )
        ) {

            mapaTipos.set(
                descripcion,
                {
                    tipo: {
                        descripcion
                    },
                    cantidad: 0,
                    promedio: 0
                }
            );

        }

        const tipo =
            mapaTipos.get(
                descripcion
            );

        tipo.cantidad++;

        tipo.promedio +=
            Number(
                item.promedio
            );

    });

    const tipos =
        Array.from(
            mapaTipos.values()
        ).map(tipo => ({

            ...tipo,

            promedio:
                (
                    tipo.promedio /
                    tipo.cantidad
                ).toFixed(2)

        }));

    /*=========================================
    COMPETENCIAS
    =========================================*/

    const competenciasBD =
        await EvaluacionRespuestaDetalle.findAll({

            attributes: [

                "criterio_id",

                [
                    fn(
                        "COUNT",
                        col("EvaluacionRespuestaDetalle.id")
                    ),
                    "cantidad"
                ],

                [
                    fn(
                        "AVG",
                        col("puntaje")
                    ),
                    "promedio"
                ]

            ],

            include: [

                {

                    model: EvaluacionRespuesta,

                    as: "respuesta",

                    required: true,

                    attributes: [],

                    include: [

                        {

                            model: Evaluacion,

                            as: "evaluacion",

                            attributes: [],

                            required: true,

                            where

                        }

                    ]

                },

                {

                    model: EvaluacionCriterio,

                    as: "criterio",

                    attributes: [

                        "id",

                        "descripcion"

                    ]

                }

            ],

            group: [

                "criterio.id",

                "criterio.descripcion",

                "criterio_id"

            ]

        });

    const competencias =
        competenciasBD.map(item => ({

            criterio:
                item.criterio,

            cantidad:
                Number(
                    item.get(
                        "cantidad"
                    )
                ),

            promedio:
                Number(
                    item.get(
                        "promedio"
                    )
                ).toFixed(2)

        }));

    /*=========================================
    PARTICIPANTES
    =========================================*/

    /*=========================================
    PARTICIPANTES
    =========================================*/

    const participantesBD =
        await EvaluacionRespuesta.findAll({

            attributes: [

                "empleado_id",

                "evaluador_id",

                "tipo_respuesta",

                "fecha_respuesta",

                "porcentaje"

            ],

            include: [

                {

                    model: Evaluacion,

                    as: "evaluacion",

                    attributes: [],

                    required: true,

                    where

                }

            ],

            order: [

                [

                    "fecha_respuesta",

                    "DESC"

                ]

            ]

        });

    const participantes =
        participantesBD.map(item => ({

            empleado_id:

                item.empleado_id,

            evaluador_id:

                item.evaluador_id,

            tipo_respuesta:

                item.tipo_respuesta,

            fecha_respuesta:

                item.fecha_respuesta,

            porcentaje:

                Number(

                    item.porcentaje || 0

                ).toFixed(2)

        }));

    return {

        totales,

        tipos,

        competencias,

        participantes,

        items,

        total:
            items.length

    };

};

export const obtenerReporteService = async (
    params = {}
) => {

    const tipo = String(

        params.tipo || ""

    )
        .trim()
        .toUpperCase();

    switch (tipo) {

        case "EMPLEADO":

            return await obtenerReporteEmpleado(
                params
            );

        case "SUPERVISOR":

            return await obtenerReporteSupervisor(
                params
            );

        case "MYSTERY":

            return await obtenerReporteMystery(
                params
            );

        case "AUTO":

        case "AUTOEVALUACION":

            return await obtenerReporteAutoevaluacion(
                params
            );

        default:

            throw new Error(

                `Tipo de reporte no soportado: ${tipo || "SIN TIPO"}`

            );

    }

};
const obtenerReporteEmpleado = async (params) => {

    return await obtenerDatosReporte({

        ...params,

        agrupador: "EMPLEADO"

    });

};


const obtenerReporteSupervisor = async (params) => {

    return await obtenerDatosReporte({

        ...params,

        agrupador: "SUPERVISOR",

        tipoRespuesta: "SUPERVISOR"

    });

};

const obtenerReporteMystery = async (params) => {

    return await obtenerDatosReporte({

        ...params,

        agrupador: "MYSTERY",

        tipoRespuesta: "MYSTERY"

    });

};

/*
|--------------------------------------------------------------------------
| OPCIONAL: REPORTE EXCLUSIVO DE AUTOEVALUACIÓN
|--------------------------------------------------------------------------
|
| El reporte EMPLEADO incluye AUTO, SUPERVISOR y MYSTERY.
| Esta función sirve solamente si posteriormente creas una pantalla
| específica para autoevaluaciones.
|
*/

const obtenerReporteAutoevaluacion = async (params) => {

    return await obtenerDatosReporte({

        ...params,

        agrupador: "AUTO",

        tipoRespuesta: "AUTO"

    });

};

const obtenerDatosReporte = async (params) => {

    const evaluaciones =
        await obtenerEvaluacionesReporte(params);

    const respuestas =
        normalizarRespuestasReporte(evaluaciones);

    return {

        resumen:
            await obtenerResumenReporte(
                respuestas,
                params
            ),

        indicadores:
            await obtenerIndicadoresReporte(
                respuestas,
                params
            ),

        competencias:
            await obtenerCompetenciasReporte(
                respuestas,
                params
            ),

        historico:
            await obtenerHistoricoReporte(
                respuestas,
                params
            ),

        comentarios:
            await obtenerComentariosReporte(
                respuestas,
                params
            ),

        ranking:
            await obtenerRankingReporte(
                respuestas,
                params
            ),

        radar:
            await obtenerRadarReporte(
                respuestas,
                params
            )

    };

};


// import { Op } from "sequelize";

const obtenerEvaluacionesReporte = async (params = {}) => {

    const whereEvaluacion = {};

    const whereRespuesta = {};

    const agrupador = String(

        params.agrupador || ""

    )
        .trim()
        .toUpperCase();

    const tipoRespuesta = String(

        params.tipoRespuesta || ""

    )
        .trim()
        .toUpperCase();

    /*
    |--------------------------------------------------------------------------
    | FILTROS DE EVALUACION
    |--------------------------------------------------------------------------
    */

    if (

        params.periodo !== undefined &&

        params.periodo !== null &&

        params.periodo !== ""

    ) {

        whereEvaluacion.periodo_id = Number(
            params.periodo
        );

    }

    /*
    |--------------------------------------------------------------------------
    | VALIDACIÓN DEL ID
    |--------------------------------------------------------------------------
    */

    let id = null;

    if (

        params.id !== undefined &&

        params.id !== null &&

        params.id !== ""

    ) {

        id = Number(params.id);

        if (!Number.isInteger(id) || id <= 0) {

            throw new Error(

                "El identificador del reporte no es válido."

            );

        }

    }

    /*
    |--------------------------------------------------------------------------
    | FILTROS DE EVALUACION_RESPUESTA
    |--------------------------------------------------------------------------
    */

    switch (agrupador) {

        /*
        |--------------------------------------------------------------
        | REPORTE DEL EMPLEADO
        |--------------------------------------------------------------
        |
        | Debe incluir todas las respuestas recibidas por el empleado:
        |
        | AUTO
        | SUPERVISOR
        | MYSTERY
        |
        */

        case "EMPLEADO":

            if (id !== null) {

                whereRespuesta.empleado_id = id;

            }

            break;

        /*
        |--------------------------------------------------------------
        | REPORTE DEL SUPERVISOR
        |--------------------------------------------------------------
        |
        | Debe encontrar solamente las respuestas realizadas por ese
        | supervisor.
        |
        */

        case "SUPERVISOR":

            if (id !== null) {

                whereRespuesta.evaluador_id = id;

            }

            whereRespuesta.tipo_respuesta = "SUPERVISOR";

            break;

        /*
        |--------------------------------------------------------------
        | REPORTE AUTOEVALUACIÓN
        |--------------------------------------------------------------
        |
        | No se utiliza evaluador_id IS NULL porque MYSTERY también
        | puede tener evaluador_id vacío.
        |
        */

        case "AUTO":

            if (id !== null) {

                whereRespuesta.empleado_id = id;

            }

            whereRespuesta.tipo_respuesta = "AUTO";

            break;

        /*
        |--------------------------------------------------------------
        | REPORTE MYSTERY
        |--------------------------------------------------------------
        |
        | Si se recibe id, se interpreta como el empleado evaluado,
        | porque Mystery no necesariamente tiene evaluador_id.
        |
        */

        case "MYSTERY":

            if (id !== null) {

                whereRespuesta.empleado_id = id;

            }

            whereRespuesta.tipo_respuesta = "MYSTERY";

            break;

        default:

            if (tipoRespuesta) {

                whereRespuesta.tipo_respuesta =
                    tipoRespuesta;

            }

            break;

    }

    return await Evaluacion.findAll({

        where: whereEvaluacion,

        include: [

            {

                model: EvaluacionRespuesta,

                as: "respuestas",

                where: whereRespuesta,

                required: true,

                include: [

                    {

                        model: EvaluacionRespuestaDetalle,

                        as: "detalles",

                        required: false,

                        include: [

                            {

                                model: EvaluacionCriterio,

                                as: "criterio",

                                required: false

                            }

                        ]

                    }

                ]

            },

            {

                model: EvaluacionPeriodo,

                as: "periodo",

                required: false

            },

            {

                model: EvaluacionTipo,

                as: "tipo",

                required: false

            }

        ],

        order: [

            [
                "fecha_inicio",
                "DESC"
            ],

            [
                "id",
                "DESC"
            ]

        ],

        distinct: true

    });

};

const normalizarRespuestasReporte = (
    evaluaciones = []
) => {

    const respuestasNormalizadas = [];

    evaluaciones.forEach(evaluacion => {

        const respuestas = Array.isArray(

            evaluacion?.respuestas

        )
            ? evaluacion.respuestas
            : [];

        respuestas.forEach(respuesta => {

            const detalles = Array.isArray(

                respuesta?.detalles

            )
                ? respuesta.detalles
                : [];

            respuestasNormalizadas.push({

                evaluacion_id:
                    evaluacion?.id ?? null,

                numero:
                    evaluacion?.numero ?? null,

                periodo_id:
                    evaluacion?.periodo_id ?? null,

                periodo:

                    evaluacion?.periodo?.descripcion ||

                    evaluacion?.periodo?.nombre ||

                    null,

                tipo_evaluacion_id:
                    evaluacion?.tipo_id ?? null,

                tipo_evaluacion:

                    evaluacion?.tipo?.descripcion ||

                    evaluacion?.tipo?.nombre ||

                    evaluacion?.tipo?.codigo ||

                    null,

                fecha_inicio:
                    evaluacion?.fecha_inicio ?? null,

                fecha_fin:
                    evaluacion?.fecha_fin ?? null,

                estado_evaluacion:
                    evaluacion?.estado ?? null,

                respuesta_id:
                    respuesta?.id ?? null,

                empleado_id:

                    respuesta?.empleado_id ??

                    evaluacion?.empleado_id ??

                    null,

                evaluador_id:
                    respuesta?.evaluador_id ?? null,

                tipo_respuesta: String(

                    respuesta?.tipo_respuesta || ""

                )
                    .trim()
                    .toUpperCase(),

                fecha_respuesta:

                    respuesta?.fecha_respuesta ||

                    evaluacion?.fecha_inicio ||

                    null,

                estado_respuesta:
                    respuesta?.estado ?? null,

                observaciones:
                    respuesta?.observaciones ?? null,

                puntaje_total: convertirNumero(

                    respuesta?.puntaje_total ??

                    evaluacion?.puntaje_total

                ),

                porcentaje: convertirNumero(

                    respuesta?.porcentaje ??

                    evaluacion?.porcentaje

                ),

                detalles: detalles.map(detalle => ({

                    id:
                        detalle?.id ?? null,

                    respuesta_id:
                        detalle?.respuesta_id ?? null,

                    criterio_id:
                        detalle?.criterio_id ?? null,

                    valor:
                        convertirNumero(
                            detalle?.valor
                        ),

                    puntaje:

                        detalle?.puntaje === null ||

                            detalle?.puntaje === undefined ||

                            detalle?.puntaje === ""

                            ? null

                            : convertirNumero(
                                detalle.puntaje
                            ),

                    comentario:
                        detalle?.comentario ?? null,

                    evidencia:
                        detalle?.evidencia ?? null,

                    criterio:
                        detalle?.criterio ?? null

                }))

            });

        });

    });

    return respuestasNormalizadas;

};

const convertirNumero = (valor) => {

    if (

        valor === null ||

        valor === undefined ||

        valor === ""

    ) {

        return 0;

    }

    const numero = Number(valor);

    return Number.isFinite(numero)
        ? numero
        : 0;

};


const redondear = (
    valor,
    decimales = 2
) => {

    const numero = convertirNumero(valor);

    const factor = 10 ** decimales;

    return Math.round(

        numero * factor

    ) / factor;

};


const obtenerNombreCriterio = (criterio) => {

    if (!criterio) {

        return "Sin criterio";

    }

    return (

        criterio.descripcion ||

        criterio.pregunta ||

        criterio.codigo ||

        `Criterio #${criterio.id || ""}`.trim()

    );

};


const obtenerNombreCompetencia = (criterio) => {

    if (!criterio) {

        return "GENERAL";

    }

    /*
    |--------------------------------------------------------------------------
    | COMPATIBILIDAD FUTURA
    |--------------------------------------------------------------------------
    |
    | Si EvaluacionCriterio incorpora posteriormente una asociación real
    | con competencia, este helper la reconocerá sin cambiar el resto del
    | reporte.
    |
    */

    if (

        criterio.competencia &&

        typeof criterio.competencia === "object"

    ) {

        return (

            criterio.competencia.nombre ||

            criterio.competencia.descripcion ||

            criterio.competencia.codigo ||

            "GENERAL"

        );

    }

    if (

        typeof criterio.competencia === "string" &&

        criterio.competencia.trim()

    ) {

        return criterio.competencia.trim();

    }

    /*
    |--------------------------------------------------------------------------
    | MODELO ACTUAL
    |--------------------------------------------------------------------------
    |
    | En los campos compartidos de EvaluacionCriterio no existe todavía
    | competencia_id. Por eso se utiliza la descripción o el código como
    | agrupación temporal.
    |
    */

    return (

        criterio.descripcion ||

        criterio.codigo ||

        "GENERAL"

    );

};


const obtenerResumenReporte = async (
    respuestas = [],
    params = {}
) => {

    if (!respuestas.length) {

        return {

            empleado_id: null,

            evaluador_id: null,

            periodo: null,

            tipo: null,

            totalEvaluaciones: 0,

            totalRespuestas: 0,

            ultimaEvaluacion: null,

            tiposRespuesta: {}

        };

    }

    const respuestasOrdenadas = [

        ...respuestas

    ].sort((a, b) => {

        const fechaA = a.fecha_respuesta
            ? new Date(a.fecha_respuesta).getTime()
            : 0;

        const fechaB = b.fecha_respuesta
            ? new Date(b.fecha_respuesta).getTime()
            : 0;

        return fechaB - fechaA;

    });

    const primera = respuestasOrdenadas[0];

    const evaluacionesUnicas = new Set(

        respuestas.map(item =>

            item.evaluacion_id

        )

    );

    const tiposRespuesta = respuestas.reduce(

        (resultado, respuesta) => {

            const tipo =

                respuesta.tipo_respuesta ||

                "SIN_TIPO";

            resultado[tipo] =

                (resultado[tipo] || 0) + 1;

            return resultado;

        },

        {}

    );

    return {

        empleado_id:
            primera.empleado_id,

        evaluador_id:
            primera.evaluador_id,

        periodo:
            primera.periodo,

        tipo:

            params.agrupador ||

            primera.tipo_respuesta ||

            primera.tipo_evaluacion,

        totalEvaluaciones:
            evaluacionesUnicas.size,

        totalRespuestas:
            respuestas.length,

        ultimaEvaluacion:
            primera.fecha_respuesta,

        tiposRespuesta

    };

};

const obtenerIndicadoresReporte = async (
    respuestas = []
) => {

    const porcentajes = respuestas

        .map(item =>

            convertirNumero(
                item.porcentaje
            )

        )

        .filter(valor =>

            Number.isFinite(valor)

        );

    const totalPorcentajes = porcentajes.reduce(

        (acumulado, valor) =>

            acumulado + valor,

        0

    );

    const promedio = porcentajes.length

        ? totalPorcentajes /
        porcentajes.length

        : 0;

    const evaluacionesUnicas = new Set(

        respuestas.map(item =>

            item.evaluacion_id

        )

    );

    const autoevaluaciones = respuestas.filter(

        item =>
            item.tipo_respuesta === "AUTO"

    ).length;

    const evaluacionesSupervisor = respuestas.filter(

        item =>
            item.tipo_respuesta === "SUPERVISOR"

    ).length;

    const evaluacionesMystery = respuestas.filter(

        item =>
            item.tipo_respuesta === "MYSTERY"

    ).length;

    return [

        {

            title: "Promedio",

            value:
                `${redondear(promedio, 2)}%`

        },

        {

            title: "Evaluaciones",

            value:
                evaluacionesUnicas.size

        },

        {

            title: "Autoevaluaciones",

            value:
                autoevaluaciones

        },

        {

            title: "Supervisor",

            value:
                evaluacionesSupervisor

        },

        {

            title: "Mystery Shopper",

            value:
                evaluacionesMystery

        }

    ];

};

const obtenerCompetenciasReporte = async (
    respuestas = []
) => {

    const competencias =
        agruparCompetencias(respuestas);

    return Object.values(

        competencias

    ).map(item => {

        const promedio = item.cantidad

            ? item.total / item.cantidad

            : 0;

        return {

            competencia:
                item.competencia,

            total:
                redondear(
                    item.total,
                    2
                ),

            cantidad:
                item.cantidad,

            resultado:
                redondear(
                    promedio,
                    2
                ),

            porcentaje:
                redondear(
                    promedio,
                    2
                )

        };

    });

};

const obtenerHistoricoReporte = async (
    respuestas = []
) => {

    return [

        ...respuestas

    ]
        .sort((a, b) => {

            const fechaA = a.fecha_respuesta

                ? new Date(
                    a.fecha_respuesta
                ).getTime()

                : 0;

            const fechaB = b.fecha_respuesta

                ? new Date(
                    b.fecha_respuesta
                ).getTime()

                : 0;

            return fechaB - fechaA;

        })
        .map(item => ({

            id:
                item.respuesta_id,

            respuesta_id:
                item.respuesta_id,

            evaluacion_id:
                item.evaluacion_id,

            numero:
                item.numero,

            fecha:
                item.fecha_respuesta,

            fecha_inicio:
                item.fecha_inicio,

            fecha_fin:
                item.fecha_fin,

            periodo:
                item.periodo,

            tipo:
                item.tipo_respuesta,

            tipo_respuesta:
                item.tipo_respuesta,

            tipo_evaluacion:
                item.tipo_evaluacion,

            evaluador_id:
                item.evaluador_id,

            empleado_id:
                item.empleado_id,

            porcentaje:
                redondear(
                    item.porcentaje,
                    2
                ),

            puntaje:
                redondear(
                    item.puntaje_total,
                    2
                ),

            puntaje_total:
                redondear(
                    item.puntaje_total,
                    2
                ),

            estado:

                item.estado_respuesta ||

                item.estado_evaluacion

        }));

};

const obtenerComentariosReporte = async (
    respuestas = []
) => {

    const comentarios = [];

    respuestas.forEach(respuesta => {

        const detalles = Array.isArray(

            respuesta.detalles

        )
            ? respuesta.detalles
            : [];

        detalles.forEach(detalle => {

            const comentario = String(

                detalle?.comentario || ""

            ).trim();

            if (!comentario) {

                return;

            }

            comentarios.push({

                id:
                    detalle.id,

                evaluacion_id:
                    respuesta.evaluacion_id,

                respuesta_id:
                    respuesta.respuesta_id,

                fecha:
                    respuesta.fecha_respuesta,

                empleado_id:
                    respuesta.empleado_id,

                evaluador_id:
                    respuesta.evaluador_id,

                tipo_respuesta:
                    respuesta.tipo_respuesta,

                criterio_id:
                    detalle.criterio_id,

                criterio:
                    obtenerNombreCriterio(
                        detalle.criterio
                    ),

                comentario

            });

        });

    });

    return comentarios.sort((a, b) => {

        const fechaA = a.fecha

            ? new Date(a.fecha).getTime()

            : 0;

        const fechaB = b.fecha

            ? new Date(b.fecha).getTime()

            : 0;

        return fechaB - fechaA;

    });

};

const obtenerRankingReporte = async (
    respuestas = []
) => {

    const ranking = {};

    respuestas.forEach(respuesta => {

        const empleadoId =
            respuesta.empleado_id;

        if (

            empleadoId === null ||

            empleadoId === undefined

        ) {

            return;

        }

        if (!ranking[empleadoId]) {

            ranking[empleadoId] = {

                empleado_id:
                    empleadoId,

                evaluaciones:
                    new Set(),

                respuestas:
                    0,

                total:
                    0

            };

        }

        ranking[empleadoId]
            .evaluaciones
            .add(
                respuesta.evaluacion_id
            );

        ranking[empleadoId].respuestas++;

        ranking[empleadoId].total +=

            convertirNumero(
                respuesta.porcentaje
            );

    });

    return Object.values(ranking)

        .map(item => {

            const promedio = item.respuestas

                ? item.total /
                item.respuestas

                : 0;

            return {

                empleado_id:
                    item.empleado_id,

                evaluaciones:
                    item.evaluaciones.size,

                respuestas:
                    item.respuestas,

                promedio:
                    redondear(
                        promedio,
                        2
                    )

            };

        })

        .sort((a, b) =>

            b.promedio - a.promedio

        )

        .map((item, index) => ({

            ...item,

            posicion:
                index + 1

        }));

};

const obtenerRadarReporte = async (
    respuestas = []
) => {

    const competencias =
        agruparCompetencias(respuestas);

    return Object.values(

        competencias

    ).map(item => {

        const promedio = item.cantidad

            ? item.total / item.cantidad

            : 0;

        return {

            competencia:
                item.competencia,

            promedio:
                redondear(
                    promedio,
                    2
                ),

            cantidad:
                item.cantidad

        };

    });

};

const agruparCompetencias = (
    respuestas = []
) => {

    const competencias = {};

    respuestas.forEach(respuesta => {

        const detalles = Array.isArray(

            respuesta.detalles

        )
            ? respuesta.detalles
            : [];

        detalles.forEach(detalle => {

            const competencia =
                obtenerNombreCompetencia(
                    detalle.criterio
                );

            if (!competencias[competencia]) {

                competencias[competencia] = {

                    competencia,

                    total: 0,

                    cantidad: 0

                };

            }

            /*
            |--------------------------------------------------------------------------
            | VALOR A UTILIZAR
            |--------------------------------------------------------------------------
            |
            | Se prioriza puntaje porque representa el resultado calculado del
            | criterio. Si no existe puntaje, se utiliza valor.
            |
            */

            const valor =

                detalle.puntaje !== null &&

                    detalle.puntaje !== undefined

                    ? convertirNumero(
                        detalle.puntaje
                    )

                    : convertirNumero(
                        detalle.valor
                    );

            competencias[competencia].total +=
                valor;

            competencias[competencia].cantidad++;

        });

    });

    return competencias;

};
