// controllers/evaluacion/evaluacionController.js

import { Op } from "sequelize";

import Evaluacion from "../../models/evaluacion/evaluacionModel.js";
import EvaluacionTipo from "../../models/evaluacion/evaluacionTipoModel.js";
import EvaluacionPeriodo from "../../models/evaluacion/evaluacionPeriodoModel.js";
import EvaluacionRespuesta from "../../models/evaluacion/evaluacionRespuestaModel.js";

import EmpleadoTabla from "../../models/tablas/empleadoModel.js";
import Usuario from "../../models/auth/usuarioModel.js";

import EvaluacionPlantilla from "../../models/evaluacion/evaluacionPlantillaModel.js";
import EvaluacionPlantillaDetalle from "../../models/evaluacion/evaluacionPlantillaDetalleModel.js";
import EvaluacionCriterio from "../../models/evaluacion/evaluacionCriterioModel.js";


import EvaluacionMetaAsignacion
    from "../../models/evaluacion/evaluacionMetaAsignacionModel.js";

import EvaluacionMeta
    from "../../models/evaluacion/evaluacionMetaModel.js";

// import EvaluacionPlantilla from "../../models/evaluacion/evaluacionPlantillaModel.js";

import EvaluacionSistema from "../../models/evaluacion/evaluacionSistemaModel.js";

import EvaluacionEscala from "../../models/evaluacion/evaluacionEscalaModel.js";

import {
    generarPdfEvaluacion
} from "../../services/evaluacion/evaluacionPdfService.js";

import eventService from "../../services/events/eventService.js";

import {

    obtenerResultadoCampania

} from "../../services/evaluacion/resultadoService.js";
/* ===========================================================
   LISTAR
=========================================================== */


export const listarEvaluaciones = async (req, res) => {

    try {

        const rows = await Evaluacion.findAll({

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
                    model: EvaluacionPlantilla,
                    as: "plantilla",
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

            ],

            order: [
                ["id", "DESC"]
            ]

        });

        res.json(rows);

    } catch (error) {

        console.error(error);

        res.status(500).json(error);

    }

};



/* ===========================================================
   OBTENER
=========================================================== */

export const obtenerEvaluacion = async (req, res) => {

    try {

        const row = await Evaluacion.findByPk(

            req.params.id,

            {

                include: [

                    {
                        model: EvaluacionTipo,
                        as: "tipo"
                    },

                    {
                        model: EvaluacionPlantilla,
                        as: "plantilla"
                    },

                    {
                        model: EvaluacionPeriodo,
                        as: "periodo"
                    },

                    // {
                    //     model: EmpleadoTabla,
                    //     as: "empleado"
                    // },

                    // {
                    //     model: Usuario,
                    //     as: "evaluador"
                    // },

                    {
                        model: EvaluacionRespuesta,
                        as: "respuestas",
                        include: [
                            {
                                model: EvaluacionCriterio,
                                as: "criterio"
                            }
                        ]
                    }

                ]

            }

        );

        if (!row) {

            return res.status(404).json({

                message:
                    "Evaluación no encontrada"

            });

        }

        res.json(row);

    } catch (error) {

        console.error(error);

        res.status(500).json(error);

    }

};



/* ===========================================================
   CREAR
=========================================================== */

// export const crearEvaluacion = async (req, res) => {

//     const transaction =
//         await Evaluacion.sequelize.transaction();

//     try {

//         const {

//             tipo_id,
//             plantilla_id,

//             periodo_id,

//             empleado_id,

//             evaluador_usuario_id,

//             fecha,

//             observaciones

//         } = req.body;

//         const year =
//             new Date().getFullYear();

//         const ultimo =
//             await Evaluacion.findOne({

//                 where: {

//                     numero: {

//                         [Op.like]:
//                             `EV-${year}-%`

//                     }

//                 },

//                 order: [
//                     ["id", "DESC"]
//                 ],

//                 transaction

//             });

//         let correlativo = 1;

//         if (ultimo) {

//             correlativo =
//                 parseInt(

//                     ultimo.numero
//                         .split("-")[2]

//                 ) + 1;

//         }

//         const numero =
//             `EV-${year}-${String(correlativo).padStart(6, "0")}`;

//         const evaluacion =
//             await Evaluacion.create(

//                 {

//                     numero,

//                     tipo_id,

//                     plantilla_id,

//                     periodo_id,

//                     empleado_id,

//                     evaluador_usuario_id,

//                     fecha,

//                     observaciones,

//                     estado: "PENDIENTE",

//                     puntaje_total: 0,

//                     porcentaje: 0

//                 },

//                 { transaction }

//             );

//         await transaction.commit();

//         /*=========================================================
//   NOTIFICAR EVALUACIÓN ASIGNADA
// =========================================================*/

//         try {

//             const evaluacionCompleta =
//                 await Evaluacion.findByPk(

//                     evaluacion.id,

//                     {

//                         include: [

//                             {

//                                 association:

//                                     "empleado"

//                             },

//                             {

//                                 association:

//                                     "evaluador"

//                             },

//                             {

//                                 association:

//                                     "periodo"

//                             },

//                             {

//                                 association:

//                                     "tipo"

//                             }

//                         ]

//                     }

//                 );

//             if (

//                 evaluacionCompleta?.evaluador?.email

//             ) {

//                 await eventService.publish({

//                     codigo: "EVALUACION_ASIGNADA",

//                     modulo: "EVALUACION",

//                     entidad: "Evaluacion",

//                     entidad_id: evaluacion.id,

//                     accion: "CREAR",

//                     usuario_id: req.user?.id ?? null,

//                     sucursal_id: null,

//                     fecha: new Date(),

//                     datos: {

//                         numero: evaluacionCompleta.numero,

//                         empleado:

//                             `${evaluacionCompleta.empleado?.apellido || ""}, ${evaluacionCompleta.empleado?.nombre || ""}`.trim(),

//                         evaluador: evaluacionCompleta.evaluador?.usuario,

//                         periodo: evaluacionCompleta.periodo?.descripcion,

//                         tipo: evaluacionCompleta.tipo?.nombre,

//                         fecha: evaluacionCompleta.fecha,

//                         observaciones: evaluacionCompleta.observaciones

//                     }

//                 });

//             }

//         }

//         catch (error) {

//             console.error(

//                 "Error enviando la notificación de evaluación:",

//                 error

//             );

//         }

//         res.status(201).json({

//             ok: true,

//             evaluacion

//         });

//     } catch (error) {

//         await transaction.rollback();

//         console.error(error);

//         res.status(500).json(error);

//     }

// };

export const crearEvaluacion = async (req, res) => {

    const transaction =
        await Evaluacion.sequelize.transaction();

    try {

        const {

            tipo_id,

            plantilla_id,

            periodo_id,

            fecha_inicio,

            fecha_fin,

            observaciones,

            estado = "ACTIVA"

        } = req.body;

        if (!tipo_id) {

            await transaction.rollback();

            return res.status(400).json({

                message:
                    "El tipo de evaluación es obligatorio."

            });

        }

        if (!plantilla_id) {

            await transaction.rollback();

            return res.status(400).json({

                message:
                    "La plantilla es obligatoria."

            });

        }

        if (!periodo_id) {

            await transaction.rollback();

            return res.status(400).json({

                message:
                    "El período es obligatorio."

            });

        }

        if (!fecha_inicio || !fecha_fin) {

            await transaction.rollback();

            return res.status(400).json({

                message:
                    "Las fechas de inicio y fin son obligatorias."

            });

        }

        if (

            new Date(fecha_fin) <

            new Date(fecha_inicio)

        ) {

            await transaction.rollback();

            return res.status(400).json({

                message:
                    "La fecha de fin no puede ser anterior a la fecha de inicio."

            });

        }

        const year =
            new Date().getFullYear();

        const ultimo =
            await Evaluacion.findOne({

                where: {

                    numero: {

                        [Op.like]:
                            `EV-${year}-%`

                    }

                },

                order: [

                    ["id", "DESC"]

                ],

                transaction

            });

        let correlativo = 1;

        if (ultimo) {

            const ultimoCorrelativo =
                Number(

                    ultimo.numero
                        ?.split("-")[2]

                );

            if (

                Number.isFinite(
                    ultimoCorrelativo
                )

            ) {

                correlativo =
                    ultimoCorrelativo + 1;

            }

        }

        const numero =
            `EV-${year}-${String(

                correlativo

            ).padStart(6, "0")}`;

        const evaluacion =
            await Evaluacion.create(

                {

                    numero,

                    tipo_id,

                    plantilla_id,

                    periodo_id,

                    empleado_id: null,

                    evaluador_usuario_id: null,

                    fecha: fecha_inicio,

                    fecha_inicio,

                    fecha_fin,

                    observaciones:

                        observaciones || null,

                    estado,

                    puntaje_total: 0,

                    porcentaje: 0

                },

                {

                    transaction

                }

            );

        await transaction.commit();

        return res.status(201).json({

            ok: true,

            evaluacion,

            link_publico:

                `/evaluacion/form/${evaluacion.token_publico}`

        });

    }

    catch (error) {

        await transaction.rollback();

        console.error(error);

        return res.status(500).json({

            message:

                error.message ||

                "No fue posible crear la campaña de evaluación."

        });

    }

};

/* ===========================================================
   ACTUALIZAR
=========================================================== */

// export const actualizarEvaluacion = async (req, res) => {

//     try {

//         const row =
//             await Evaluacion.findByPk(
//                 req.params.id
//             );

//         if (!row) {

//             return res.status(404).json({

//                 message:
//                     "Evaluación no encontrada"

//             });

//         }

//         const {

//             tipo_id,

//             periodo_id,

//             empleado_id,

//             evaluador_usuario_id,

//             fecha,

//             observaciones,

//             estado,
//             plantilla_id

//         } = req.body;

//         await row.update({

//             tipo_id,

//             plantilla_id,

//             periodo_id,

//             empleado_id,

//             evaluador_usuario_id,

//             fecha,

//             observaciones,

//             estado

//         });

//         await eventService.publish({

//             codigo: "EVALUACION_ACTUALIZADA",

//             modulo: "EVALUACION",

//             entidad: "Evaluacion",

//             entidad_id: row.id,

//             accion: "ACTUALIZAR",

//             usuario_id: req.user?.id ?? null,

//             sucursal_id: null,

//             fecha: new Date(),

//             datos: {

//                 numero: row.numero

//             }

//         });

//         res.json({

//             ok: true,

//             message:
//                 "Evaluación actualizada"

//         });

//     } catch (error) {

//         console.error(error);

//         res.status(500).json(error);

//     }

// };

export const actualizarEvaluacion = async (req, res) => {

    try {

        const row =
            await Evaluacion.findByPk(

                req.params.id

            );

        if (!row) {

            return res.status(404).json({

                message:
                    "Campaña de evaluación no encontrada."

            });

        }

        const {

            tipo_id,

            plantilla_id,

            periodo_id,

            fecha_inicio,

            fecha_fin,

            observaciones,

            estado

        } = req.body;

        if (!tipo_id) {

            return res.status(400).json({

                message:
                    "El tipo de evaluación es obligatorio."

            });

        }

        if (!plantilla_id) {

            return res.status(400).json({

                message:
                    "La plantilla es obligatoria."

            });

        }

        if (!periodo_id) {

            return res.status(400).json({

                message:
                    "El período es obligatorio."

            });

        }

        if (!fecha_inicio || !fecha_fin) {

            return res.status(400).json({

                message:
                    "Las fechas de inicio y fin son obligatorias."

            });

        }

        if (

            new Date(fecha_fin) <

            new Date(fecha_inicio)

        ) {

            return res.status(400).json({

                message:
                    "La fecha de fin no puede ser anterior a la fecha de inicio."

            });

        }

        await row.update({

            tipo_id,

            plantilla_id,

            periodo_id,

            empleado_id: null,

            evaluador_usuario_id: null,

            fecha: fecha_inicio,

            fecha_inicio,

            fecha_fin,

            observaciones:

                observaciones || null,

            estado:

                estado || row.estado

        });

        return res.json({

            ok: true,

            message:
                "Campaña de evaluación actualizada.",

            evaluacion: row,

            link_publico:

                `/evaluacion/form/${row.token_publico}`

        });

    }

    catch (error) {

        console.error(error);

        return res.status(500).json({

            message:

                error.message ||

                "No fue posible actualizar la campaña de evaluación."

        });

    }

};

/* ===========================================================
   ELIMINAR
=========================================================== */

export const eliminarEvaluacion = async (req, res) => {

    const transaction =
        await Evaluacion.sequelize.transaction();

    try {

        const row =
            await Evaluacion.findByPk(

                req.params.id,

                { transaction }

            );

        if (!row) {

            await transaction.rollback();

            return res.status(404).json({

                message:
                    "Evaluación no encontrada"

            });

        }

        await EvaluacionRespuesta.destroy({

            where: {

                evaluacion_id:
                    row.id

            },

            transaction

        });

        await row.destroy({

            transaction

        });

        await transaction.commit();
        await eventService.publish({

            codigo: "EVALUACION_ELIMINADA",

            modulo: "EVALUACION",

            entidad: "Evaluacion",

            entidad_id: row.id,

            accion: "ELIMINAR",

            usuario_id: req.user?.id ?? null,

            sucursal_id: null,

            fecha: new Date(),

            datos: {

                numero: row.numero

            }

        });
        res.json({

            ok: true,

            message:
                "Evaluación eliminada"

        });

    } catch (error) {

        await transaction.rollback();

        console.error(error);

        res.status(500).json(error);

    }

};


/* ===========================================================
   RESPONDER EVALUACION
=========================================================== */

export const guardarRespuestasEvaluacion = async (req, res) => {

    const transaction =
        await Evaluacion.sequelize.transaction();

    try {

        const { id } = req.params;

        const {

            respuestas = []

        } = req.body;

        const evaluacion =
            await Evaluacion.findByPk(
                id,
                { transaction }
            );

        if (!evaluacion) {

            await transaction.rollback();

            return res.status(404).json({
                message:
                    "Evaluación no encontrada"
            });

        }

        await EvaluacionRespuesta.destroy({

            where: {
                evaluacion_id: id
            },

            transaction

        });

        if (respuestas.length) {

            await EvaluacionRespuesta.bulkCreate(

                respuestas.map(item => ({

                    evaluacion_id: id,

                    criterio_id:
                        item.criterio_id,

                    puntaje:
                        item.puntaje,

                    comentario:
                        item.comentario || null

                })),

                {
                    transaction
                }

            );

        }

        await transaction.commit();
        await eventService.publish({

            codigo: "EVALUACION_RESPONDIDA",

            modulo: "EVALUACION",

            entidad: "Evaluacion",

            entidad_id: evaluacion.id,

            accion: "RESPONDER",

            usuario_id: req.user?.id ?? null,

            sucursal_id: null,

            fecha: new Date(),

            datos: {

                numero: evaluacion.numero,

                respuestas: respuestas.length

            }

        });
        res.json({

            ok: true,

            message:
                "Respuestas guardadas"

        });

    } catch (error) {

        await transaction.rollback();

        console.error(error);

        res.status(500).json(error);

    }

};



/* ===========================================================
   FINALIZAR EVALUACION
=========================================================== */

export const finalizarEvaluacion = async (req, res) => {

    const transaction =
        await Evaluacion.sequelize.transaction();

    try {

        const { id } = req.params;

        const evaluacion =
            await Evaluacion.findByPk(
                id,
                { transaction }
            );

        if (!evaluacion) {

            await transaction.rollback();

            return res.status(404).json({

                message:
                    "Evaluación no encontrada"

            });

        }

        const respuestas =
            await EvaluacionRespuesta.findAll({

                where: {
                    evaluacion_id: id
                },

                include: [

                    {
                        model: EvaluacionCriterio,
                        as: "criterio"
                    }

                ],

                transaction

            });

        let puntajeObtenido = 0;

        let puntajeMaximo = 0;

        for (const respuesta of respuestas) {

            puntajeObtenido +=
                Number(
                    respuesta.puntaje || 0
                );

            puntajeMaximo +=
                Number(
                    respuesta.criterio?.puntaje_maximo || 0
                );

        }

        const porcentaje =
            puntajeMaximo > 0
                ? (
                    puntajeObtenido * 100
                ) / puntajeMaximo
                : 0;

        await evaluacion.update({

            puntaje_total:
                puntajeObtenido,

            porcentaje:
                porcentaje.toFixed(2),

            estado:
                "FINALIZADA"

        },
            {
                transaction
            });

        await transaction.commit();
        const evaluacionCompleta =
            await Evaluacion.findByPk(

                evaluacion.id,

                {

                    include: [

                        {

                            association: "empleado"

                        },

                        {

                            association: "evaluador"

                        },

                        {

                            association: "periodo"

                        },

                        {

                            association: "tipo"

                        }

                    ]

                }

            );
        await eventService.publish({

            codigo: "EVALUACION_FINALIZADA",

            modulo: "EVALUACION",

            entidad: "Evaluacion",

            entidad_id: evaluacion.id,

            accion: "FINALIZAR",

            usuario_id: req.user?.id ?? null,

            sucursal_id: null,

            fecha: new Date(),

            datos: {

                numero: evaluacionCompleta.numero,

                empleado:

                    `${evaluacionCompleta.empleado?.apellido || ""}, ${evaluacionCompleta.empleado?.nombre || ""}`.trim(),

                evaluador: evaluacionCompleta.evaluador?.usuario,

                periodo: evaluacionCompleta.periodo?.descripcion,

                tipo: evaluacionCompleta.tipo?.nombre,

                resultado:

                    Number(

                        evaluacionCompleta.porcentaje

                    ).toFixed(2) + "%",

                fecha:

                    evaluacionCompleta.fecha

            }

        });

        res.json({

            ok: true,

            puntaje_total:
                puntajeObtenido,

            porcentaje:
                porcentaje.toFixed(2)

        });

    } catch (error) {

        await transaction.rollback();

        console.error(error);

        res.status(500).json(error);

    }

};



/* ===========================================================
   CAMBIAR ESTADO
=========================================================== */

export const cambiarEstadoEvaluacion = async (req, res) => {

    try {

        const { id } =
            req.params;

        const { estado } =
            req.body;

        const evaluacion =
            await Evaluacion.findByPk(id);

        if (!evaluacion) {

            return res.status(404).json({

                message:
                    "Evaluación no encontrada"

            });

        }

        await evaluacion.update({

            estado

        });

        /*=========================================================
          NOTIFICACIONES SEGÚN ESTADO
        =========================================================*/

        try {

            const evaluacionCompleta =
                await Evaluacion.findByPk(

                    evaluacion.id,

                    {

                        include: [

                            {

                                association: "empleado"

                            },

                            {

                                association: "evaluador"

                            },

                            {

                                association: "periodo"

                            },

                            {

                                association: "tipo"

                            }

                        ]

                    }

                );

            switch (estado) {

                case "PUBLICADA":

                    await eventService.publish({

                        codigo: "RESULTADO_PUBLICADO",

                        modulo: "EVALUACION",

                        entidad: "Evaluacion",

                        entidad_id: evaluacion.id,

                        accion: "PUBLICAR",

                        usuario_id: req.user?.id ?? null,

                        sucursal_id: null,

                        fecha: new Date(),

                        datos: {

                            numero:

                                evaluacionCompleta.numero,

                            empleado:

                                `${evaluacionCompleta.empleado?.apellido || ""}, ${evaluacionCompleta.empleado?.nombre || ""}`.trim(),

                            evaluador:

                                evaluacionCompleta.evaluador?.usuario,

                            periodo:

                                evaluacionCompleta.periodo?.descripcion,

                            tipo:

                                evaluacionCompleta.tipo?.nombre,

                            resultado:

                                Number(

                                    evaluacionCompleta.porcentaje

                                ).toFixed(2) + "%",

                            fecha:

                                evaluacionCompleta.fecha

                        }

                    });

                    break;

                default:

                    break;

            }

        }

        catch (error) {

            console.error(

                "Error enviando notificación:",

                error

            );

        }

        res.json({

            ok: true,

            message:
                "Estado actualizado"

        });
    } catch (error) {

        console.error(error);

        res.status(500).json(error);

    }

};



/* ===========================================================
   DUPLICAR EVALUACION
=========================================================== */

export const duplicarEvaluacion = async (req, res) => {

    const transaction =
        await Evaluacion.sequelize.transaction();

    try {

        const original =
            await Evaluacion.findByPk(

                req.params.id,

                {

                    include: [

                        {

                            model: EvaluacionRespuesta,

                            as: "respuestas"

                        }

                    ],

                    transaction

                }

            );

        if (!original) {

            await transaction.rollback();

            return res.status(404).json({

                message:
                    "Evaluación no encontrada"

            });

        }

        const year =
            new Date().getFullYear();

        const numero =
            `EV-${year}-${Date.now()}`;

        const nueva =
            await Evaluacion.create({

                numero,

                tipo_id:
                    original.tipo_id,

                plantilla_id:
                    original.plantilla_id,

                periodo_id:
                    original.periodo_id,

                empleado_id:
                    original.empleado_id,

                evaluador_usuario_id:
                    original.evaluador_usuario_id,

                fecha:
                    original.fecha,

                observaciones:
                    original.observaciones,

                estado:
                    "PENDIENTE",

                puntaje_total: 0,

                porcentaje: 0

            },
                {
                    transaction
                });

        await transaction.commit();
        await eventService.publish({

            codigo: "EVALUACION_DUPLICADA",

            modulo: "EVALUACION",

            entidad: "Evaluacion",

            entidad_id: nueva.id,

            accion: "DUPLICAR",

            usuario_id: req.user?.id ?? null,

            sucursal_id: null,

            fecha: new Date(),

            datos: {

                numero: nueva.numero

            }

        });
        res.json({

            ok: true,

            evaluacion:
                nueva

        });

    } catch (error) {

        await transaction.rollback();

        console.error(error);

        res.status(500).json(error);

    }

};

/* ===========================================================
   OBTENER FORMULARIO DE EVALUACION
=========================================================== */

const obtenerFormularioEvaluacionInterno = async (id) => {

    const evaluacion =
        await Evaluacion.findByPk(

            id,

            {

                include: [

                    {
                        model: EvaluacionTipo,
                        as: "tipo"
                    },

                    {
                        model: EvaluacionPlantilla,
                        as: "plantilla"
                    },

                    {
                        model: EvaluacionPeriodo,
                        as: "periodo"
                    },

                    // {
                    //     model: EmpleadoTabla,
                    //     as: "empleado"
                    // },

                    // {
                    //     model: Usuario,
                    //     as: "evaluador"
                    // }

                ]

            }

        );

    if (!evaluacion) {

        return null;

    }

    const plantilla =
        await EvaluacionPlantilla.findByPk(

            evaluacion.plantilla_id,

            {

                include: [

                    {

                        model: EvaluacionPlantillaDetalle,

                        as: "detalles",

                        include: [

                            {

                                model: EvaluacionCriterio,

                                as: "criterio"

                            }

                        ]

                    }

                ]

            }

        );

    if (!plantilla) {

        return null;

    }

    const respuestas =
        await EvaluacionRespuesta.findAll({

            where: {

                evaluacion_id:
                    evaluacion.id

            }

        });

    const criterios =
        plantilla.detalles.map(detalle => {

            const respuesta =
                respuestas.find(

                    r =>
                        r.criterio_id ===
                        detalle.criterio_id

                );

            return {

                criterio_id:
                    detalle.criterio.id,

                codigo:
                    detalle.criterio.codigo,

                descripcion:
                    detalle.criterio.descripcion,

                puntaje_maximo:
                    detalle.criterio.puntaje_maximo,

                orden:
                    detalle.orden,

                peso:
                    detalle.peso,

                obligatorio:
                    detalle.obligatorio,

                permite_comentario:
                    detalle.permite_comentario,

                permite_evidencia:
                    detalle.permite_evidencia,

                puntaje:
                    respuesta
                        ? respuesta.puntaje
                        : null,

                comentario:
                    respuesta
                        ? respuesta.comentario
                        : ""

            };

        });

    return {

        id:
            evaluacion.id,

        numero:
            evaluacion.numero,

        fecha:
            evaluacion.fecha,

        estado:
            evaluacion.estado,

        porcentaje:
            evaluacion.porcentaje,

        empleado:
            evaluacion.empleado,

        evaluador:
            evaluacion.evaluador,

        tipo:
            evaluacion.tipo,

        plantilla:
            evaluacion.plantilla,

        periodo:
            evaluacion.periodo,

        criterios

    };

};

export const obtenerFormularioEvaluacion = async (req, res) => {

    try {

        const formulario =
            await obtenerFormularioEvaluacionInterno(
                req.params.id
            );

        if (!formulario) {

            return res.status(404).json({

                message:
                    "Evaluación no encontrada"

            });

        }

        res.json(formulario);

    } catch (error) {

        console.error(error);

        res.status(500).json(error);

    }

};
/* ===========================================================
   MIS EVALUACIONES
=========================================================== */

export const listarMisEvaluaciones = async (req, res) => {

    try {

        const usuarioId =
            req.user.id;

        const rows =
            await Evaluacion.findAll({

                where: {

                    evaluador_usuario_id:
                        usuarioId

                },

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

                        model: EvaluacionPlantilla,

                        as: "plantilla",

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

                    // {

                    //     model: EmpleadoTabla,

                    //     as: "empleado",

                    //     attributes: [

                    //         "id",

                    //         "apellido",

                    //         "nombre"

                    //     ]

                    // }

                ],

                order: [

                    ["estado", "ASC"],

                    ["fecha", "DESC"],

                    ["id", "DESC"]

                ]

            });

        res.json(rows);

    } catch (error) {

        console.error(error);

        res.status(500).json(error);

    }

};

/* ===========================================================
   DESCARGAR PDF
=========================================================== */

export const descargarPdfEvaluacion = async (req, res) => {

    try {

        const evaluacion =
            await obtenerFormularioEvaluacionInterno(
                req.params.id
            );

        if (!evaluacion) {

            return res.status(404).json({

                message:
                    "Evaluación no encontrada"

            });

        }

        const pdf =
            generarPdfEvaluacion(
                evaluacion
            );

        res.setHeader(
            "Content-Type",
            "application/pdf"
        );

        res.setHeader(
            "Content-Disposition",
            `inline; filename=Evaluacion-${evaluacion.numero}.pdf`
        );

        pdf.pipe(res);

        pdf.end();

    } catch (error) {

        console.error(error);

        res.status(500).json({

            message:
                "Error al generar el PDF."

        });

    }

};

/* ===========================================================
   HISTORIAL DE EVALUACIONES DEL EMPLEADO
=========================================================== */

export const obtenerEvaluacionesEmpleado = async (req, res) => {

    try {

        const empleado =
            await EmpleadoTabla.findByPk(

                req.params.id

            );

        if (!empleado) {

            return res.status(404).json({

                message:
                    "Empleado no encontrado."

            });

        }

        const evaluaciones =
            await Evaluacion.findAll({

                where: {

                    empleado_id:
                        req.params.id

                },

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

                    // {

                    //     model: Usuario,

                    //     as: "evaluador",

                    //     attributes: [

                    //         "id",

                    //         "usuario"

                    //     ]

                    // }

                ],

                order: [

                    ["fecha", "DESC"],

                    ["id", "DESC"]

                ]

            });

        const cantidad =
            evaluaciones.length;

        const promedio =
            cantidad === 0

                ? 0

                : evaluaciones.reduce(

                    (total, item) =>

                        total +

                        Number(
                            item.porcentaje || 0
                        ),

                    0

                ) / cantidad;

        const mejor =
            cantidad === 0

                ? 0

                : Math.max(

                    ...evaluaciones.map(

                        x => Number(
                            x.porcentaje || 0
                        )

                    )

                );

        const ultima =
            cantidad === 0

                ? 0

                : Number(

                    evaluaciones[0].porcentaje || 0

                );

        res.json({

            empleado,

            indicadores: {

                cantidad,

                promedio:
                    Number(
                        promedio.toFixed(2)
                    ),

                mejor,

                ultima

            },

            evaluaciones

        });

    } catch (error) {

        console.error(error);

        res.status(500).json(error);

    }

};

/* ===========================================================
   RESULTADO EVALUACIÓN
=========================================================== */

export const obtenerResultadoEvaluacion = async (

    req,

    res

) => {

    try {

        const evaluacionId = Number(

            req.params.id

        );

        if (

            !Number.isInteger(evaluacionId) ||

            evaluacionId <= 0

        ) {

            return res.status(400).json({

                message:

                    "El identificador de la campaña no es válido."

            });

        }

        const resultado =

            await obtenerResultadoCampania(

                evaluacionId

            );

        if (

            !resultado ||

            !resultado.campania

        ) {

            return res.status(404).json({

                message:

                    "La campaña de evaluación no existe."

            });

        }

        return res.json({

            campania:

                resultado.campania,

            indicadores:

                resultado.indicadores || {

                    cantidad: 0,

                    promedio: 0,

                    auto: 0,

                    supervisor: 0,

                    mystery: 0

                },

            ranking:

                resultado.ranking || [],

            competencias:

                resultado.competencias || [],

            preguntas:

                resultado.preguntas || [],

            participantes:

                resultado.participantes || []

        });

    }

    catch (error) {

        console.error(

            "Error obteniendo resultado de campaña:",

            error

        );

        return res.status(500).json({

            message:

                error.message ||

                "Error obteniendo el resultado de la campaña."

        });

    }

};

/* ===========================================================
   FORMULARIO PÚBLICO
=========================================================== */

export const obtenerFormularioPublico = async (req, res) => {

    try {

        const { token_publico } = req.params;

        const evaluacion = await Evaluacion.findOne({

            where: {

                token_publico: token_publico

            },

            include: [

                {
                    model: EvaluacionTipo,
                    as: "tipo"
                },

                {
                    model: EvaluacionPeriodo,
                    as: "periodo"
                },

                {
                    model: EvaluacionPlantilla,
                    as: "plantilla",
                    include: [

                        {
                            model: EvaluacionPlantillaDetalle,
                            as: "detalles",
                            include: [

                                {
                                    model: EvaluacionCriterio,
                                    as: "criterio"
                                }

                            ]
                        }

                    ]
                }

            ]

        });

        if (!evaluacion) {

            return res.status(404).json({

                message: "La campaña de evaluación no existe o ya no se encuentra disponible."

            });

        }

        // Validación de vigencia
        const hoy = new Date();

        if (

            evaluacion.fecha_inicio &&

            hoy < new Date(evaluacion.fecha_inicio)

        ) {

            return res.status(400).json({

                message: "La campaña todavía no se encuentra habilitada."

            });

        }

        if (

            evaluacion.fecha_fin &&

            hoy > new Date(evaluacion.fecha_fin)

        ) {

            return res.status(400).json({

                message: "La campaña de evaluación ya no se encuentra vigente."

            });

        }

        if (!evaluacion.plantilla) {

            return res.status(404).json({

                message: "La campaña no posee una plantilla asociada."

            });

        }

        if (

            !evaluacion.plantilla.detalles ||

            evaluacion.plantilla.detalles.length === 0

        ) {

            return res.status(400).json({

                message: "La plantilla no posee criterios."

            });

        }

        res.json({

            id: evaluacion.id,

            token: evaluacion.token_publico,

            numero: evaluacion.numero,

            fecha_inicio: evaluacion.fecha_inicio,

            fecha_fin: evaluacion.fecha_fin,

            observaciones: evaluacion.observaciones,

            tipo: {

                id: evaluacion.tipo.id,

                codigo: evaluacion.tipo.codigo,

                descripcion: evaluacion.tipo.descripcion

            },

            periodo: {

                id: evaluacion.periodo.id,

                descripcion: evaluacion.periodo.descripcion

            },

            plantilla: {

                id: evaluacion.plantilla.id,

                descripcion: evaluacion.plantilla.descripcion

            },

            criterios:

                evaluacion.plantilla.detalles

                    .sort((a, b) => a.orden - b.orden)

                    .map(item => ({

                        plantilla_detalle_id: item.id,

                        id: item.criterio.id,

                        codigo: item.criterio.codigo,

                        descripcion: item.criterio.descripcion,

                        pregunta: item.criterio.pregunta,

                        tipo_respuesta: item.criterio.tipo_respuesta,

                        puntaje_maximo: item.criterio.puntaje_maximo,

                        orden: item.orden,

                        peso: item.peso,

                        obligatorio: item.obligatorio,

                        permite_comentario: item.permite_comentario,

                        permite_evidencia: item.permite_evidencia

                    }))

        });

    }

    catch (error) {

        console.error("ERROR FORMULARIO PUBLICO");

        console.error(error);

        console.error(error.stack);

        return res.status(500).json({

            message: error.message,

            stack: error.stack

        });

    }

};

// import * as reporteService from "../../services/evaluacion/reporteService.js";

import {

    obtenerReporteService

} from "../../services/evaluacion/reporteService.js";

export const obtenerReporte = async (req, res) => {

    try {

        const resultado =
            await obtenerReporteService(req.query);

        res.json(resultado);

    } catch (error) {

        console.error(error);

        res.status(500).json(error);

    }

};