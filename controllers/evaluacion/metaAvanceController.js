import EvaluacionMetaAvance
    from "../../models/evaluacion/evaluacionMetaAvanceModel.js";

import EvaluacionMetaAsignacion
    from "../../models/evaluacion/evaluacionMetaAsignacionModel.js";

import {

    recalcularCumplimiento,

    actualizarValorActual,

    calcularPorcentaje

}
    from "../../services/evaluacion/metaService.js";

/*=========================================================
  LISTAR AVANCES
=========================================================*/

export const listarAvances = async (req, res) => {

    try {

        const avances =
            await EvaluacionMetaAvance.findAll({

                include: [

                    {

                        model: EvaluacionMetaAsignacion,

                        as: "asignacion"

                    }

                ],

                order: [

                    ["fecha", "DESC"]

                ]

            });

        res.json(

            avances

        );

    }

    catch (error) {

        console.error(error);

        res.status(500).json({

            message:

                "Error obteniendo avances."

        });

    }

};

/*=========================================================
  OBTENER AVANCE
=========================================================*/

export const obtenerAvance = async (req, res) => {

    try {

        const avance =
            await EvaluacionMetaAvance.findByPk(

                req.params.id,

                {

                    include: [

                        {

                            model: EvaluacionMetaAsignacion,

                            as: "asignacion"

                        }

                    ]

                }

            );

        if (!avance) {

            return res.status(404).json({

                message:

                    "Avance no encontrado."

            });

        }

        res.json(

            avance

        );

    }

    catch (error) {

        console.error(error);

        res.status(500).json({

            message:

                "Error obteniendo avance."

        });

    }

};

/*=========================================================
  CREAR AVANCE
=========================================================*/

export const crearAvance = async (req, res) => {

    try {

        const avance =
            await EvaluacionMetaAvance.create(

                req.body

            );

        res.status(201).json(

            avance

        );

    }

    catch (error) {

        console.error(error);

        res.status(500).json({

            message:

                "Error creando avance."

        });

    }

};

/*=========================================================
  ACTUALIZAR AVANCE
=========================================================*/

export const actualizarAvance = async (req, res) => {

    try {

        const avance =
            await EvaluacionMetaAvance.findByPk(

                req.params.id

            );

        if (!avance) {

            return res.status(404).json({

                message:

                    "Avance no encontrado."

            });

        }

        await avance.update(

            req.body

        );

        res.json(

            avance

        );

    }

    catch (error) {

        console.error(error);

        res.status(500).json({

            message:

                "Error actualizando avance."

        });

    }

};

/*=========================================================
  ELIMINAR AVANCE
=========================================================*/

export const eliminarAvance = async (req, res) => {

    try {

        const avance =
            await EvaluacionMetaAvance.findByPk(

                req.params.id

            );

        if (!avance) {

            return res.status(404).json({

                message:

                    "Avance no encontrado."

            });

        }

        await avance.destroy();

        res.json({

            message:

                "Avance eliminado."

        });

    }

    catch (error) {

        console.error(error);

        res.status(500).json({

            message:

                "Error eliminando avance."

        });

    }

};

/*=========================================================
  RECALCULAR CUMPLIMIENTO
=========================================================*/

// const recalcularCumplimiento = async (asignacionId) => {

//     const asignacion =
//         await EvaluacionMetaAsignacion.findByPk(

//             asignacionId,

//             {

//                 include: [

//                     {

//                         model: EvaluacionMeta,

//                         as: "meta"

//                     }

//                 ]

//             }

//         );

//     if (!asignacion) {

//         throw new Error(

//             "Asignación no encontrada."

//         );

//     }

//     const valorObjetivo = Number(

//         asignacion.meta?.valor_objetivo || 0

//     );

//     const valorActual = Number(

//         asignacion.valor_actual || 0

//     );

//     let porcentaje = 0;

//     if (

//         valorObjetivo > 0

//     ) {

//         porcentaje =

//             (

//                 valorActual /

//                 valorObjetivo

//             ) * 100;

//     }

//     if (

//         porcentaje > 100

//     ) {

//         porcentaje = 100;

//     }

//     let estado =

//         asignacion.estado;

//     if (

//         porcentaje >= 100

//     ) {

//         estado = "CUMPLIDA";

//     }

//     else if (

//         porcentaje > 0

//     ) {

//         estado = "EN_PROCESO";

//     }

//     else {

//         estado = "ASIGNADA";

//     }

//     await asignacion.update({

//         porcentaje_cumplimiento:

//             porcentaje,

//         estado

//     });

//     return asignacion;

// };

/*=========================================================
  REGISTRAR AVANCE
=========================================================*/

export const registrarAvance = async (req, res) => {

    try {

        const {

            asignacion_id,

            fecha,

            valor_actual,

            comentario,

            usuario_id

        } = req.body;

        const asignacion =
            await EvaluacionMetaAsignacion.findByPk(

                asignacion_id,

                {

                    include: [

                        {

                            model: EvaluacionMeta,

                            as: "meta"

                        }

                    ]

                }

            );

        if (!asignacion) {

            return res.status(404).json({

                message:

                    "Asignación no encontrada."

            });

        }

        const valorAnterior =

            Number(

                asignacion.valor_actual || 0

            );

        const nuevoValor =

            Number(

                valor_actual || 0

            );

        const objetivo =

            Number(

                asignacion.meta?.valor_objetivo || 0

            );

        // let porcentaje = 0;

        // if (

        //     objetivo > 0

        // ) {

        //     porcentaje =

        //         (

        //             nuevoValor /

        //             objetivo

        //         ) * 100;

        // }

        // if (

        //     porcentaje > 100

        // ) {

        //     porcentaje = 100;

        // }

        // const avance =
        //     await EvaluacionMetaAvance.create({

        //         asignacion_id,

        //         fecha,

        //         valor_anterior:

        //             valorAnterior,

        //         valor_actual:

        //             nuevoValor,

        //         porcentaje,

        //         comentario,

        //         usuario_id

        //     });

        // await asignacion.update({

        //     valor_actual:

        //         nuevoValor

        // });

        // await recalcularCumplimiento(

        //     asignacion.id

        // );



        // const asignacionActualizada =
        //     await EvaluacionMetaAsignacion.findByPk(

        //         asignacion.id,

        //         {

        //             include: [

        //                 {

        //                     model: EvaluacionMeta,

        //                     as: "meta"

        //                 }

        //             ]

        //         }

        //     );

        const porcentaje =

            calcularPorcentaje(

                nuevoValor,

                asignacion.meta.valor_objetivo

            );

        const avance =

            await EvaluacionMetaAvance.create({

                asignacion_id,

                fecha,

                valor_anterior:

                    valorAnterior,

                valor_actual:

                    nuevoValor,

                porcentaje,

                comentario,

                usuario_id

            });

        await actualizarValorActual(

            asignacion.id,

            nuevoValor

        );

        const asignacionActualizada =

            await recalcularCumplimiento(

                asignacion.id

            );

        res.status(201).json({

            message:

                "Avance registrado correctamente.",

            avance,

            asignacion:

                asignacionActualizada

        });

    }

    catch (error) {

        console.error(error);

        res.status(500).json({

            message:

                "Error registrando el avance."

        });

    }

};

