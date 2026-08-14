import { Op } from "sequelize";

import Evaluacion from "../../../models/evaluacion/evaluacionModel.js";
import EvaluacionRespuesta from "../../../models/evaluacion/evaluacionRespuestaModel.js";



import EvaluacionRespuestaDetalle
    from "../../../models/evaluacion/evaluacionRespuestaDetalleModel.js";


/*=========================================================
OBTENER DETALLE RESPUESTA
=========================================================*/
/*=========================================================
OBTENER SERIE HISTORICA
=========================================================*/

/*=========================================================
OBTENER SERIE HISTORICA
=========================================================*/

const obtenerSerieHistorica = async (

    empleadoId,

    tipoRespuesta,

    tipoId,

    plantillaId,

    limite = 5

) => {

    const respuestas = await EvaluacionRespuesta.findAll({

        where: {

            empleado_id: empleadoId,

            tipo_respuesta: tipoRespuesta,

            estado: "FINALIZADA"

        },

        include: [

            {

                model: Evaluacion,

                as: "evaluacion",

                where: {

                    tipo_id: tipoId,

                    plantilla_id: plantillaId

                },

                attributes: []

            }

        ],

        order: [

            ["fecha_respuesta", "DESC"],

            ["id", "DESC"]

        ],

        limit: limite

    });

    return respuestas

        .reverse()

        .map((respuesta) => ({

            respuestaId: respuesta.id,

            porcentaje: Number(

                respuesta.porcentaje || 0

            ),

            puntaje: Number(

                respuesta.puntaje_total || 0

            ),

            fecha: respuesta.fecha_respuesta

        }));

};
const obtenerDetalleRespuesta = async (

    respuestaId

) => {

    return await EvaluacionRespuestaDetalle.findAll({

        where: {

            respuesta_id:

                respuestaId

        }

    });

};
/*=========================================================
CONTAR RESPUESTAS DEL EMPLEADO
=========================================================*/

const contarRespuestasEmpleado = async (

    empleadoId

) => {

    return await EvaluacionRespuesta.count({

        where: {

            empleado_id:

                empleadoId,

            estado:

                "FINALIZADA"

        }

    });

};

/*=========================================================
OBTENER RANKING
=========================================================*/

const obtenerRanking = async (

    tipoId,

    plantillaId

) => {

    const resultados =

        await EvaluacionRespuesta.findAll({

            attributes:[

                "empleado_id",

                [
                    sequelize.fn(

                        "AVG",

                        sequelize.col("porcentaje")

                    ),

                    "promedio"

                ]

            ],

            include:[

                {

                    model:Evaluacion,

                    as:"evaluacion",

                    attributes:[],

                    where:{

                        tipo_id:tipoId,

                        plantilla_id:plantillaId,

                        estado:"FINALIZADA"

                    }

                }

            ],

            group:[

                "empleado_id"

            ],

            raw:true

        });

    return resultados;

};

/*=========================================================
OBTENER RESPUESTA
=========================================================*/

const obtenerRespuesta = async (

    respuestaId

) => {

    const respuesta =

        await EvaluacionRespuesta.findByPk(

            respuestaId

        );

    if (!respuesta) {

        throw new Error(

            "La respuesta de evaluación no existe."

        );

    }

    return respuesta;

};


/*=========================================================
OBTENER EVALUACION
=========================================================*/

const obtenerEvaluacion = async (

    evaluacionId

) => {

    const evaluacion =

        await Evaluacion.findByPk(

            evaluacionId

        );

    if (!evaluacion) {

        throw new Error(

            "La evaluación no existe."

        );

    }

    return evaluacion;

};


/*=========================================================
OBTENER HISTORICO
=========================================================*/

const obtenerHistorico = async (

    respuesta,

    evaluacion

) => {

    return await EvaluacionRespuesta.findOne({

        include: [

            {

                model: Evaluacion,

                as: "evaluacion",

                required: true,

                where: {

                    tipo_id:

                        evaluacion.tipo_id,

                    plantilla_id:

                        evaluacion.plantilla_id

                }

            }

        ],

        where: {

            empleado_id:

                respuesta.empleado_id,

            tipo_respuesta:

                respuesta.tipo_respuesta,

            estado:

                "FINALIZADA",

            id: {

                [Op.ne]:

                    respuesta.id

            }

        },

        order: [

            [

                "fecha_respuesta",

                "DESC"

            ]

        ]

    });

};


/*=========================================================
OBTENER ULTIMA RESPUESTA
=========================================================*/

const obtenerUltimaRespuesta = async (

    empleadoId

) => {

    return await EvaluacionRespuesta.findOne({

        where: {

            empleado_id:

                empleadoId,

            estado:

                "FINALIZADA"

        },

        order: [

            [

                "fecha_respuesta",

                "DESC"

            ]

        ]

    });

};


/*=========================================================
OBTENER RESPUESTAS EMPLEADO
=========================================================*/

const obtenerRespuestasEmpleado = async (

    empleadoId

) => {

    return await EvaluacionRespuesta.findAll({

        where: {

            empleado_id:

                empleadoId,

            estado:

                "FINALIZADA"

        },

        order: [

            [

                "fecha_respuesta",

                "DESC"

            ]

        ]

    });

};


/*=========================================================
PROMEDIO HISTORICO
=========================================================*/

const obtenerPromedioHistorico = async (

    empleadoId

) => {

    const respuestas =

        await obtenerRespuestasEmpleado(

            empleadoId

        );

    if (

        respuestas.length === 0

    ) {

        return 0;

    }

    const suma = respuestas.reduce(

        (

            total,

            item

        ) => {

            return (

                total +

                Number(

                    item.porcentaje || 0

                )

            );

        },

        0

    );

    return (

        suma /

        respuestas.length

    );

};


/*=========================================================
OBTENER PARTICIPACION
=========================================================*/

const obtenerParticipacion = async () => {

    /*
    Pendiente

    Se implementará cuando
    exista el módulo de
    asignaciones de evaluación.
    */

    return null;

};


/*=========================================================
OBTENER KPIS
=========================================================*/

const obtenerKPIs = async () => {

    /*
    Pendiente

    Integración futura
    con Evaluacion KPI.
    */

    return [];

};


/*=========================================================
OBTENER COMPETENCIAS
=========================================================*/

const obtenerCompetencias = async () => {

    /*
    Pendiente

    Integración futura
    con Competencias.
    */

    return [];

};


export default {

    obtenerRespuesta,

    obtenerEvaluacion,

    obtenerHistorico,

    obtenerUltimaRespuesta,

    obtenerRespuestasEmpleado,

    obtenerPromedioHistorico,

    obtenerParticipacion,

    obtenerKPIs,

    obtenerCompetencias,

    contarRespuestasEmpleado,

    obtenerDetalleRespuesta,

    obtenerSerieHistorica,

    obtenerRanking

};