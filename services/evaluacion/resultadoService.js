import {

    fn,

    col,

    literal

} from "sequelize";

import Evaluacion from "../../models/evaluacion/evaluacionModel.js";

import EvaluacionTipo from "../../models/evaluacion/evaluacionTipoModel.js";

import EvaluacionPeriodo from "../../models/evaluacion/evaluacionPeriodoModel.js";

import EvaluacionRespuesta from "../../models/evaluacion/evaluacionRespuestaModel.js";

import EvaluacionRespuestaDetalle from "../../models/evaluacion/evaluacionRespuestaDetalleModel.js";

import EvaluacionCriterio from "../../models/evaluacion/evaluacionCriterioModel.js";

export const obtenerCampania = async (

    evaluacionId

) => {

    return await Evaluacion.findByPk(

        evaluacionId,

        {

            include: [

                {

                    model: EvaluacionTipo,

                    as: "tipo"

                },

                {

                    model: EvaluacionPeriodo,

                    as: "periodo"

                }

            ]

        }

    );

};

export const obtenerIndicadores = async (

    evaluacionId

) => {

    const respuestas =

        await EvaluacionRespuesta.findAll({

            where: {

                evaluacion_id: evaluacionId

            }

        });

    const total = respuestas.length;

    const promedio =

        total === 0

            ? 0

            : respuestas.reduce(

                (a, b) =>

                    a + Number(b.porcentaje),

                0

            ) / total;

    return {

        cantidad: total,

        promedio:

            Number(

                promedio.toFixed(2)

            ),

        auto:

            respuestas.filter(

                r =>

                    r.tipo_respuesta === "AUTO"

            ).length,

        supervisor:

            respuestas.filter(

                r =>

                    r.tipo_respuesta === "SUPERVISOR"

            ).length,

        mystery:

            respuestas.filter(

                r =>

                    r.tipo_respuesta === "MYSTERY"

            ).length

    };

};

export const obtenerRanking = async (

    evaluacionId

) => {

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

            ],

            [

                fn(

                    "MAX",

                    col("fecha_respuesta")

                ),

                "ultima"

            ]

        ],

        where: {

            evaluacion_id: evaluacionId,

            estado: "FINALIZADA"

        },

        group: [

            "empleado_id"

        ],

        order: [

            [

                literal("promedio"),

                "DESC"

            ]

        ],

        raw: true

    });

};

export const obtenerCompetencias = async (

    evaluacionId

) => {

    return await EvaluacionRespuestaDetalle.findAll({

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

            ],

            [

                fn(

                    "MIN",

                    col("puntaje")

                ),

                "minimo"

            ],

            [

                fn(

                    "MAX",

                    col("puntaje")

                ),

                "maximo"

            ]

        ],

        include: [

            {

                model: EvaluacionRespuesta,

                as: "respuesta",

                attributes: [],

                where: {

                    evaluacion_id: evaluacionId,

                    estado: "FINALIZADA"

                }

            },

            {

                model: EvaluacionCriterio,

                as: "criterio",

                attributes: [

                    "id",

                    "codigo",

                    "descripcion",

                    "pregunta",

                    "puntaje_maximo"

                ]

            }

        ],

        group: [

            "criterio_id",

            "criterio.id"

        ],

        order: [

            [

                literal("promedio"),

                "DESC"

            ]

        ],

        raw: false

    });

};

export const obtenerPreguntas = async (

    evaluacionId

) => {

    const preguntas =

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

                        col("valor")

                    ),

                    "promedio"

                ]

            ],

            include: [

                {

                    model: EvaluacionRespuesta,

                    as: "respuesta",

                    attributes: [],

                    where: {

                        evaluacion_id: evaluacionId,

                        estado: "FINALIZADA"

                    }

                },

                {

                    model: EvaluacionCriterio,

                    as: "criterio",

                    attributes: [

                        "id",

                        "codigo",

                        "descripcion",

                        "pregunta",

                        "puntaje_maximo"

                    ]

                }

            ],

            group: [

                "criterio_id",

                "criterio.id"

            ],

            order: [

                [

                    "criterio_id",

                    "ASC"

                ]

            ]

        });

    const resultado = [];

    for (const pregunta of preguntas) {

        const comentarios =

            await EvaluacionRespuestaDetalle.findAll({

                attributes: [

                    "comentario",

                    "valor"

                ],

                where: {

                    criterio_id:

                        pregunta.criterio_id

                },

                include: [

                    {

                        model: EvaluacionRespuesta,

                        as: "respuesta",

                        attributes: [],

                        where: {

                            evaluacion_id: evaluacionId,

                            estado: "FINALIZADA"

                        }

                    }

                ]

            });

        resultado.push({

            criterio:

                pregunta.criterio,

            cantidad:

                Number(

                    pregunta.get(

                        "cantidad"

                    )

                ),

            promedio:

                Number(

                    pregunta.get(

                        "promedio"

                    )

                ),

            comentarios

        });

    }

    return resultado;

};

export const obtenerParticipantes = async (

    evaluacionId

) => {

    return await EvaluacionRespuesta.findAll({

        attributes: [

            "empleado_id",

            "evaluador_id",

            "tipo_respuesta",

            "porcentaje",

            "fecha_respuesta"

        ],

        where: {

            evaluacion_id: evaluacionId,

            estado: "FINALIZADA"

        },

        order: [

            [

                "fecha_respuesta",

                "DESC"

            ]

        ],

        raw: true

    });

};

export const obtenerResultadoCampania = async (

    evaluacionId

) => {

    const [

        campania,

        indicadores,

        ranking,

        competencias,

        preguntas,

        participantes

    ] = await Promise.all([

        obtenerCampania(

            evaluacionId

        ),

        obtenerIndicadores(

            evaluacionId

        ),

        obtenerRanking(

            evaluacionId

        ),

        obtenerCompetencias(

            evaluacionId

        ),

        obtenerPreguntas(

            evaluacionId

        ),

        obtenerParticipantes(

            evaluacionId

        )

    ]);

    return {

        campania,

        indicadores,

        ranking,

        competencias,

        preguntas,

        participantes

    };

};

/*=========================================
UNE DOS LISTAS POR ID
=========================================*/

const unirColecciones = (

    lista1 = [],

    lista2 = [],

    obtenerClave

) => {

    const mapa = new Map();

    lista1.forEach(item => {

        mapa.set(

            obtenerClave(item),

            {

                campania1: item,

                campania2: null

            }

        );

    });

    lista2.forEach(item => {

        const clave =

            obtenerClave(item);

        if (

            mapa.has(clave)

        ) {

            mapa.get(clave).campania2 = item;

        }

        else {

            mapa.set(

                clave,

                {

                    campania1: null,

                    campania2: item

                }

            );

        }

    });

    const resultado =

        [

            ...mapa.values()

        ];

    resultado.forEach(item => {

        Object.assign(

            item,

            construirComparativo(

                item.campania1?.promedio,

                item.campania2?.promedio

            )

        );

    });

    return resultado;

};

const unirIndicadores = (

    indicadores1,

    indicadores2

) => {

    return [

        {

            codigo: "PROMEDIO",

            descripcion: "Promedio General",

            ...construirComparativo(

                indicadores1.promedio,

                indicadores2.promedio

            )

        },

        {

            codigo: "RESPUESTAS",

            descripcion: "Respuestas",

            ...construirComparativo(

                indicadores1.cantidad,

                indicadores2.cantidad

            )

        },

        {

            codigo: "PUNTAJE",

            descripcion: "Puntaje Total",

            ...construirComparativo(

                indicadores1.puntaje,

                indicadores2.puntaje

            )

        }

    ];

};

/*=========================================
CALCULA COMPARATIVO
=========================================*/

const construirComparativo = (

    valor1,

    valor2

) => {

    const campania1 =

        Number(valor1 || 0);

    const campania2 =

        Number(valor2 || 0);

    const diferencia =

        campania2 - campania1;

    const variacion =

        campania1 === 0

            ? 0

            : (

                diferencia * 100

            ) / campania1;

    let tendencia = "IGUAL";

    if (diferencia > 0) {

        tendencia = "SUBE";

    }

    if (diferencia < 0) {

        tendencia = "BAJA";

    }

    return {

        campania1,

        campania2,

        diferencia,

        variacion,

        tendencia

    };

};

/*=========================================
UNE RANKING POR EMPLEADO
=========================================*/

const unirRanking = (

    lista1 = [],

    lista2 = []

) => {

    const mapa = new Map();

    lista1.forEach(item => {

        mapa.set(

            Number(

                item.empleado_id

            ),

            {

                empleado_id:

                    Number(

                        item.empleado_id

                    ),

                campania1:

                    Number(

                        item.promedio || 0

                    ),

                campania2: null,

                cantidad1:

                    Number(

                        item.cantidad || 0

                    ),

                cantidad2: 0

            }

        );

    });

    lista2.forEach(item => {

        const empleadoId = Number(

            item.empleado_id

        );

        if (

            mapa.has(

                empleadoId

            )

        ) {

            const registro = mapa.get(

                empleadoId

            );

            registro.campania2 =

                Number(

                    item.promedio || 0

                );

            registro.cantidad2 =

                Number(

                    item.cantidad || 0

                );

        }

        else {

            mapa.set(

                empleadoId,

                {

                    empleado_id:

                        empleadoId,

                    campania1: null,

                    campania2:

                        Number(

                            item.promedio || 0

                        ),

                    cantidad1: 0,

                    cantidad2:

                        Number(

                            item.cantidad || 0

                        )

                }

            );

        }

    });
    const resultado =

        Array.from(

            mapa.values()

        );

    resultado.forEach(item => {

        Object.assign(

            item,

            construirComparativo(

                item.campania1,

                item.campania2

            )

        );

    });

    return resultado.sort(

        (

            a,

            b

        ) =>

            b.campania2 -

            a.campania2

    );

};

export const obtenerComparativoCampanias = async (

    evaluacion1,

    evaluacion2

) => {

    const [

        campania1,

        campania2,

        indicadores1,

        indicadores2,

        ranking1,

        ranking2,

        competencias1,

        competencias2,

        preguntas1,

        preguntas2

    ] = await Promise.all([

        obtenerCampania(

            evaluacion1

        ),

        obtenerCampania(

            evaluacion2

        ),

        obtenerIndicadores(

            evaluacion1

        ),

        obtenerIndicadores(

            evaluacion2

        ),

        obtenerRanking(

            evaluacion1

        ),

        obtenerRanking(

            evaluacion2

        ),

        obtenerCompetencias(

            evaluacion1

        ),

        obtenerCompetencias(

            evaluacion2

        ),

        obtenerPreguntas(

            evaluacion1

        ),

        obtenerPreguntas(

            evaluacion2

        )

    ]);

    return {

        campania1,

        campania2,

        indicadores:

            unirIndicadores(

                indicadores1,

                indicadores2

            ),

        ranking:

            unirRanking(

                ranking1,

                ranking2

            ),

        competencias:

            unirColecciones(

                competencias1,

                competencias2,

                item =>

                    item.criterio.id

            ),

        preguntas:

            unirColecciones(

                preguntas1,

                preguntas2,

                item =>

                    item.criterio.id

            )

    };
};

