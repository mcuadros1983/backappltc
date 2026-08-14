import { fn, col, literal } from "sequelize";

import Evaluacion from "../../models/evaluacion/evaluacionModel.js";
import EvaluacionRespuesta from "../../models/evaluacion/evaluacionRespuestaModel.js";
import EvaluacionTipo from "../../models/evaluacion/evaluacionTipoModel.js";
import EvaluacionPeriodo from "../../models/evaluacion/evaluacionPeriodoModel.js";

import { Op } from "sequelize";
import EvaluacionMeta from "../../models/evaluacion/evaluacionMetaModel.js";

// import EvaluacionRespuesta from "../../models/evaluacion/evaluacionRespuestaModel.js";

import EmpleadoTabla from "../../models/tablas/empleadoModel.js";

export const obtenerCampanias = async () => {

    const campanias = await Evaluacion.findAll({

        include: [

            {

                model: EvaluacionTipo,

                as: "tipo",

                attributes: [

                    "descripcion"

                ]

            },

            {

                model: EvaluacionPeriodo,

                as: "periodo",

                attributes: [

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

            ["fecha_inicio", "DESC"]

        ]

    });

    return campanias.map(c => {

        const respuestas =

            c.respuestas || [];

        const cantidad =

            respuestas.length;

        const promedio =

            cantidad === 0

                ? 0

                : respuestas.reduce(

                    (a, b) =>

                        a + Number(b.porcentaje),

                    0

                ) / cantidad;

        return {

            id: c.id,

            numero: c.numero,

            tipo:

                c.tipo?.descripcion,

            periodo:

                c.periodo?.descripcion,

            fecha_inicio:

                c.fecha_inicio,

            fecha_fin:

                c.fecha_fin,

            estado:

                c.estado,

            respuestas:

                cantidad,

            promedio:

                Number(

                    promedio

                ).toFixed(2)

        };

    });

};

export const obtenerIndicadores = async () => {

    const campanias =
        await Evaluacion.count();

    const campaniasActivas =
        await Evaluacion.count({

            where: {

                estado: "ACTIVA"

            }

        });

    const respuestas =
        await EvaluacionRespuesta.count();

    const finalizadas =
        await EvaluacionRespuesta.count({

            where: {

                estado: "FINALIZADA"

            }

        });

    const promedio =
        await EvaluacionRespuesta.findOne({

            attributes: [

                [

                    fn(

                        "AVG",

                        col("porcentaje")

                    ),

                    "promedio"

                ]

            ],

            raw: true

        });

    return {

        campanias,

        campaniasActivas,

        respuestas,

        finalizadas,

        promedio:

            Number(

                promedio?.promedio || 0

            ).toFixed(2)

    };

};

export const obtenerUltimasRespuestas = async () => {

    return await EvaluacionRespuesta.findAll({

        include: [

            {

                model: Evaluacion,

                as: "evaluacion",

                attributes: [

                    "id",

                    "numero"

                ],

                include: [

                    {

                        model: EvaluacionTipo,

                        as: "tipo",

                        attributes: [

                            "descripcion"

                        ]

                    },

                    {

                        model: EvaluacionPeriodo,

                        as: "periodo",

                        attributes: [

                            "descripcion"

                        ]

                    }

                ]

            }

        ],

        order: [

            [

                "fecha_respuesta",

                "DESC"

            ]

        ],

        limit: 10

    });

};

export const obtenerRanking = async () => {

    return await EvaluacionRespuesta.findAll({

        attributes: [

            "empleado_id",

            [

                fn(

                    "COUNT",

                    col("id")

                ),

                "cantidad"

            ],

            [

                fn(

                    "AVG",

                    col("porcentaje")

                ),

                "promedio"

            ]

        ],

        group: [

            "empleado_id"

        ],

        order: [

            [

                literal("promedio"),

                "DESC"

            ]

        ],

        limit: 10,

        raw: true

    });

};

export const obtenerPromedioTipos = async () => {

    const datos = await EvaluacionRespuesta.findAll({

        attributes: [

            "tipo_respuesta",

            [

                fn(

                    "COUNT",

                    col("EvaluacionRespuesta.id")

                ),

                "cantidad"

            ],

            [

                fn(

                    "AVG",

                    col("EvaluacionRespuesta.porcentaje")

                ),

                "promedio"

            ]

        ],

        group: [

            "tipo_respuesta"

        ],

        raw: true

    });

    return datos.map(item => ({

        tipo: item.tipo_respuesta,

        cantidad: Number(

            item.cantidad || 0

        ),

        promedio: Number(

            item.promedio || 0

        ).toFixed(2)

    }));

};

export const obtenerPromedioPeriodos = async () => {

    const datos = await EvaluacionRespuesta.findAll({

        attributes: [

            [

                col("evaluacion->periodo.id"),

                "periodo_id"

            ],

            [

                col("evaluacion->periodo.descripcion"),

                "periodo"

            ],

            [

                fn(

                    "COUNT",

                    col("EvaluacionRespuesta.id")

                ),

                "cantidad"

            ],

            [

                fn(

                    "AVG",

                    col("EvaluacionRespuesta.porcentaje")

                ),

                "promedio"

            ]

        ],

        include: [

            {

                model: Evaluacion,

                as: "evaluacion",

                attributes: [],

                include: [

                    {

                        model: EvaluacionPeriodo,

                        as: "periodo",

                        attributes: []

                    }

                ]

            }

        ],

        group: [

            col("evaluacion->periodo.id"),

            col("evaluacion->periodo.descripcion")

        ],

        raw: true

    });

    return datos.map(item => ({

        periodo: {

            id: Number(item.periodo_id),

            descripcion: item.periodo

        },

        cantidad: Number(item.cantidad),

        promedio: Number(item.promedio).toFixed(2)

    }));

};

/*==========================================================
FRECUENCIA ESPERADA POR CAPA
==========================================================*/

const CAPAS = [

    {
        tipo: "AUTO",
        nombre: "Autoevaluación"
    },

    {
        tipo: "SUPERVISOR",
        nombre: "Supervisor"
    },

    {
        tipo: "MYSTERY",
        nombre: "Mystery"
    }

];

const calcularEstadoFrecuencia = (

    diasTranscurridos,

    frecuenciaEsperada

) => {

    if (

        diasTranscurridos === null ||

        diasTranscurridos === undefined

    ) {

        return {

            estado: "VENCIDA",

            severidad: "danger"

        };

    }

    if (

        diasTranscurridos >

        frecuenciaEsperada

    ) {

        return {

            estado: "VENCIDA",

            severidad: "danger"

        };

    }

    if (

        diasTranscurridos >=

        frecuenciaEsperada * 0.8

    ) {

        return {

            estado: "PROXIMA",

            severidad: "warning"

        };

    }

    return {

        estado: "VIGENTE",

        severidad: "success"

    };

};

const calcularDiasTranscurridos = fecha => {

    if (!fecha) {

        return null;

    }

    const hoy = new Date();

    const ultima = new Date(fecha);

    return Math.floor(

        (hoy - ultima) /

        (1000 * 60 * 60 * 24)

    );

};

const obtenerFrecuenciaEmpleado = async (

    empleado,

    capa,

    metas,

    indiceRespuestas

) => {

    const meta = metas.find(

        item =>

            item.categoria === "FRECUENCIA" &&

            item.tipo === capa.tipo &&

            item.estado === "ACTIVA"

    );

    const frecuenciaEsperada =

        Number(

            meta?.valor_objetivo || 0

        );

    const respuesta =

        indiceRespuestas.get(

            `${empleado.id}_${capa.tipo}`

        ) || null;

    const ultimaFecha =

        respuesta?.fecha_respuesta || null;

    const dias =

        calcularDiasTranscurridos(

            ultimaFecha

        );

    const estado =

        calcularEstadoFrecuencia(

            dias,

            frecuenciaEsperada

        );

    const nuncaEvaluado = !respuesta;

    return {

        empleado_id:

            empleado.id,

        empleado:

            `${empleado.apellido || ""} ${empleado.nombre || ""}`.trim(),

        tipo:

            capa.tipo,

        capa:

            capa.nombre,

        ultima_fecha:

            ultimaFecha,

        nunca_evaluado:

            nuncaEvaluado,

        dias_transcurridos:

            nuncaEvaluado
                ? null
                : dias,

        frecuencia_esperada:

            frecuenciaEsperada,

        estado:

            estado.estado,

        severidad:

            estado.severidad

    };

};

export const obtenerFrecuenciaEsperada = async () => {

    const [

        empleados,

        metas,

        indiceRespuestas

    ] = await Promise.all([

        EmpleadoTabla.findAll({

            where: {

                fechabaja: null

            },

            order: [

                [

                    "apellido",

                    "ASC"

                ],

                [

                    "nombre",

                    "ASC"

                ]

            ]

        }),

        EvaluacionMeta.findAll({

            where: {

                categoria: "FRECUENCIA",

                estado: "ACTIVA"

            }

        }),

        obtenerIndiceRespuestas()

    ]);

    const resultado = [];

    for (

        const empleado of empleados

    ) {

        for (

            const capa of CAPAS

        ) {

            resultado.push(

                await obtenerFrecuenciaEmpleado(

                    empleado,

                    capa,

                    metas,

                    indiceRespuestas

                )

            );

        }

    }

    return {

        total:

            resultado.length,

        vigentes:

            resultado.filter(

                item =>

                    item.estado === "VIGENTE"

            ).length,

        proximas:

            resultado.filter(

                item =>

                    item.estado === "PROXIMA"

            ).length,

        vencidas:

            resultado.filter(

                item =>

                    item.estado === "VENCIDA"

            ).length,

        items:

            resultado

    };

};

/*==========================================================
CUMPLIMIENTO ESPERADO
==========================================================*/

const calcularEstadoCumplimiento = (

    porcentaje,

    minimo

) => {

    if (porcentaje >= minimo) {

        return {

            estado: "CUMPLE",

            severidad: "success"

        };

    }

    if (porcentaje >= minimo * 0.8) {

        return {

            estado: "RIESGO",

            severidad: "warning"

        };

    }

    return {

        estado: "NO_CUMPLE",

        severidad: "danger"

    };

};

const obtenerCumplimientoEmpleado = async (

    empleado,

    capa,

    metas,

    indicePromedios

) => {

    const meta = metas.find(

        item =>

            item.categoria === "CUMPLIMIENTO" &&

            item.tipo === capa.tipo &&

            item.estado === "ACTIVA"

    );

    const minimo =

        Number(

            meta?.valor_objetivo || 0

        );

    const respuestas =

        indicePromedios.get(

            `${empleado.id}_${capa.tipo}`

        ) || [];

    let promedio = 0;

    if (respuestas.length) {

        promedio =

            respuestas.reduce(

                (total, item) =>

                    total +

                    Number(

                        item.porcentaje

                    ),

                0

            ) /

            respuestas.length;

    }

    const estado =

        calcularEstadoCumplimiento(

            promedio,

            minimo

        );

    return {

        empleado_id:

            empleado.id,

        empleado:

            `${empleado.apellido || ""} ${empleado.nombre || ""}`.trim(),

        tipo:

            capa.tipo,

        promedio:

            Number(

                promedio

            ).toFixed(2),

        minimo,

        estado:

            estado.estado,

        severidad:

            estado.severidad

    };

};

export const obtenerCumplimientoEsperado = async () => {

    const [

        empleados,

        metas,

        indicePromedios

    ] = await Promise.all([

        EmpleadoTabla.findAll({

            where: {

                fechabaja: null

            }

        }),

        EvaluacionMeta.findAll({

            where: {

                categoria: "CUMPLIMIENTO",

                estado: "ACTIVA"

            }

        }),

        obtenerIndicePromedios()

    ]);

    const resultado = [];

    for (const empleado of empleados) {

        for (const capa of CAPAS) {

            resultado.push(
                await obtenerCumplimientoEmpleado(

                    empleado,

                    capa,

                    metas,

                    indicePromedios

                )

            );

        }

    }

    return {

        total:

            resultado.length,

        cumplen:

            resultado.filter(

                x =>

                    x.estado === "CUMPLE"

            ).length,

        riesgo:

            resultado.filter(

                x =>

                    x.estado === "RIESGO"

            ).length,

        incumplen:

            resultado.filter(

                x =>

                    x.estado === "NO_CUMPLE"

            ).length,

        items:

            resultado

    };

};

/*==========================================================
BRECHAS ENTRE CAPAS
==========================================================*/

const calcularEstadoBrecha = (

    diferencia,

    maxima

) => {

    if (diferencia <= maxima) {

        return {

            estado: "CORRECTA",

            severidad: "success"

        };

    }

    if (

        diferencia <=

        maxima * 1.5

    ) {

        return {

            estado: "RIESGO",

            severidad: "warning"

        };

    }

    return {

        estado: "FUERA_RANGO",

        severidad: "danger"

    };

};

// export const obtenerBrechasEsperadas = async () => {

//     const [

//         metas,

//         empleados,

//         indice

//     ] = await Promise.all([

//         EvaluacionMeta.findAll({

//             where: {

//                 categoria: "BRECHA",

//                 estado: "ACTIVA"

//             }

//         }),

//         EmpleadoTabla.findAll({

//             where: {

//                 fechabaja: null

//             }

//         }),

//         obtenerIndiceUltimasRespuestas()

//     ]);

//     const resultado = [];

//     for (const empleado of empleados) {

//         const auto =

//             indice.get(

//                 `${empleado.id}_AUTO`

//             ) || null;

//         const supervisor =

//             indice.get(

//                 `${empleado.id}_SUPERVISOR`

//             ) || null;

//         const mystery =

//             indice.get(

//                 `${empleado.id}_MYSTERY`

//             ) || null;

//         const metaAuto = metas.find(

//             x =>

//                 x.comparacion ===

//                 "AUTO ↔ SUPERVISOR"

//         );

//         const metaMystery = metas.find(

//             x =>

//                 x.comparacion ===

//                 "SUPERVISOR ↔ MYSTERY",

//         );

//         if (

//             auto &&

//             supervisor

//         ) {

//             const diferencia =

//                 Math.abs(

//                     Number(

//                         auto.porcentaje

//                     ) -

//                     Number(

//                         supervisor.porcentaje

//                     )

//                 );

//             const estado =

//                 calcularEstadoBrecha(

//                     diferencia,

//                     Number(

//                         metaAuto?.valor_objetivo || 0

//                     )

//                 );

//             resultado.push({

//                 empleado_id:

//                     empleado.id,

//                 empleado:

//                     `${empleado.apellido || ""} ${empleado.nombre || ""}`.trim(),

//                 comparacion:

//                     "AUTO ↔ SUPERVISOR",

//                 diferencia,

//                 maxima:

//                     Number(

//                         metaAuto?.valor_objetivo || 0

//                     ),

//                 estado:

//                     estado.estado,

//                 severidad:

//                     estado.severidad

//             });

//         }

//         if (

//             mystery &&

//             supervisor

//         ) {

//             const diferencia =

//                 Math.abs(

//                     Number(

//                         mystery.porcentaje

//                     ) -

//                     Number(

//                         supervisor.porcentaje

//                     )

//                 );

//             const estado =

//                 calcularEstadoBrecha(

//                     diferencia,

//                     Number(

//                         metaMystery?.valor_objetivo || 0

//                     )

//                 );

//             resultado.push({

//                 empleado_id:

//                     empleado.id,

//                 empleado:

//                     `${empleado.apellido || ""} ${empleado.nombre || ""}`.trim(),

//                 comparacion:

//                     "SUPERVISOR ↔ MYSTERY",

//                 diferencia,

//                 maxima:

//                     Number(

//                         metaMystery?.valor_objetivo || 0

//                     ),

//                 estado:

//                     estado.estado,

//                 severidad:

//                     estado.severidad

//             });

//         }

//     }

//     return {

//         total:

//             resultado.length,

//         correctas:

//             resultado.filter(

//                 x =>

//                     x.estado === "CORRECTA"

//             ).length,

//         riesgo:

//             resultado.filter(

//                 x =>

//                     x.estado === "RIESGO"

//             ).length,

//         fueraRango:

//             resultado.filter(

//                 x =>

//                     x.estado === "FUERA_RANGO"

//             ).length,

//         items:

//             resultado

//     };

// };

export const obtenerBrechasEsperadas = async () => {

    const [

        metas,

        empleados,

        indice

    ] = await Promise.all([

        EvaluacionMeta.findAll({

            where: {

                categoria: "BRECHA",

                estado: "ACTIVA"

            }

        }),

        EmpleadoTabla.findAll({

            where: {

                fechabaja: null

            },

            order: [

                ["apellido", "ASC"],

                ["nombre", "ASC"]

            ]

        }),

        obtenerIndiceUltimasRespuestas()

    ]);

    const resultado = [];

    for (const empleado of empleados) {

        const auto =
            indice.get(`${empleado.id}_AUTO`) || null;

        const supervisor =
            indice.get(`${empleado.id}_SUPERVISOR`) || null;

        const mystery =
            indice.get(`${empleado.id}_MYSTERY`) || null;

        const metaAutoSupervisor = metas.find(
            x => x.comparacion === "AUTO ↔ SUPERVISOR"
        );

        const metaAutoMystery = metas.find(
            x => x.comparacion === "AUTO ↔ MYSTERY"
        );

        const metaSupervisorMystery = metas.find(
            x => x.comparacion === "SUPERVISOR ↔ MYSTERY"
        );

        if (auto && supervisor) {

            const diferencia = Math.abs(
                Number(auto.porcentaje) -
                Number(supervisor.porcentaje)
            );

            const estado = calcularEstadoBrecha(
                diferencia,
                Number(metaAutoSupervisor?.valor_objetivo || 0)
            );

            resultado.push({

                empleado_id: empleado.id,

                empleado: `${empleado.apellido || ""} ${empleado.nombre || ""}`.trim(),

                comparacion: "AUTO ↔ SUPERVISOR",

                diferencia,

                maxima: Number(
                    metaAutoSupervisor?.valor_objetivo || 0
                ),

                estado: estado.estado,

                severidad: estado.severidad

            });

        }

        if (auto && mystery) {

            const diferencia = Math.abs(
                Number(auto.porcentaje) -
                Number(mystery.porcentaje)
            );

            const estado = calcularEstadoBrecha(
                diferencia,
                Number(metaAutoMystery?.valor_objetivo || 0)
            );

            resultado.push({

                empleado_id: empleado.id,

                empleado: `${empleado.apellido || ""} ${empleado.nombre || ""}`.trim(),

                comparacion: "AUTO ↔ MYSTERY",

                diferencia,

                maxima: Number(
                    metaAutoMystery?.valor_objetivo || 0
                ),

                estado: estado.estado,

                severidad: estado.severidad

            });

        }

        if (supervisor && mystery) {

            const diferencia = Math.abs(
                Number(supervisor.porcentaje) -
                Number(mystery.porcentaje)
            );

            const estado = calcularEstadoBrecha(
                diferencia,
                Number(metaSupervisorMystery?.valor_objetivo || 0)
            );

            resultado.push({

                empleado_id: empleado.id,

                empleado: `${empleado.apellido || ""} ${empleado.nombre || ""}`.trim(),

                comparacion: "SUPERVISOR ↔ MYSTERY",

                diferencia,

                maxima: Number(
                    metaSupervisorMystery?.valor_objetivo || 0
                ),

                estado: estado.estado,

                severidad: estado.severidad

            });

        }

    }

    return {

        total: resultado.length,

        correctas: resultado.filter(
            x => x.estado === "CORRECTA"
        ).length,

        riesgo: resultado.filter(
            x => x.estado === "RIESGO"
        ).length,

        fueraRango: resultado.filter(
            x => x.estado === "FUERA_RANGO"
        ).length,

        items: resultado

    };

};

const obtenerIndiceRespuestas = async () => {

    const respuestas =
        await EvaluacionRespuesta.findAll({

            where: {

                estado: "FINALIZADA"

            },

            order: [

                [

                    "fecha_respuesta",

                    "DESC"

                ]

            ]

        });

    const indice = new Map();

    respuestas.forEach(respuesta => {

        const key =

            `${respuesta.empleado_id}_${respuesta.tipo_respuesta}`;

        if (!indice.has(key)) {

            indice.set(

                key,

                respuesta

            );

        }

    });

    return indice;

};


const obtenerIndicePromedios = async () => {

    const respuestas =
        await EvaluacionRespuesta.findAll({

            where: {

                estado: "FINALIZADA"

            }

        });

    const indice = new Map();

    respuestas.forEach(respuesta => {

        const key =

            `${respuesta.empleado_id}_${respuesta.tipo_respuesta}`;

        if (!indice.has(key)) {

            indice.set(

                key,

                []

            );

        }

        indice.get(key).push(

            Number(

                respuesta.porcentaje

            )

        );

    });

    return indice;

};


const obtenerIndiceUltimasRespuestas = async () => {

    const respuestas =
        await EvaluacionRespuesta.findAll({

            where: {

                estado: "FINALIZADA"

            },

            order: [

                [

                    "fecha_respuesta",

                    "DESC"

                ]

            ]

        });

    const indice = new Map();

    respuestas.forEach(item => {

        const key =

            `${item.empleado_id}_${item.tipo_respuesta}`;

        if (!indice.has(key)) {

            indice.set(

                key,

                item

            );

        }

    });

    return indice;

};