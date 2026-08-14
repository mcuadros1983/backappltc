import EvaluacionMetaAsignacion
    from "../../models/evaluacion/evaluacionMetaAsignacionModel.js";

import EvaluacionMeta
    from "../../models/evaluacion/evaluacionMetaModel.js";

import EmpleadoTabla from "../../models/tablas/empleadoModel.js";

import EvaluacionPeriodo
    from "../../models/evaluacion/evaluacionPeriodoModel.js";

import Usuario
    from "../../models/auth/usuarioModel.js";

/*=========================================================
  LISTAR
=========================================================*/

export const listarAsignaciones = async (req, res) => {

    try {

        const items =
            await EvaluacionMetaAsignacion.findAll({

                include: [

                    {

                        model: EvaluacionMeta,

                        as: "meta"

                    },

                    // {

                    //     model: EmpleadoTabla,

                    //     as: "empleado"

                    // },

                    // {

                    //     model: Usuario,

                    //     as: "supervisor"

                    // },

                    {

                        model: EvaluacionPeriodo,

                        as: "periodo"

                    }

                ],

                order: [

                    ["createdAt", "DESC"]

                ]

            });

        res.json(

            items

        );

    }

    catch (error) {

        console.error(error);

        res.status(500).json({

            message:

                "Error obteniendo asignaciones."

        });

    }

};

/*=========================================================
  OBTENER
=========================================================*/

export const obtenerAsignacion = async (req, res) => {

    try {

        const item =
            await EvaluacionMetaAsignacion.findByPk(

                req.params.id,

                {

                    include: [

                        {

                            model: EvaluacionMeta,

                            as: "meta"

                        },

                        // {

                        //     model: EmpleadoTabla,

                        //     as: "empleado"

                        // },

                        // {

                        //     model: Usuario,

                        //     as: "supervisor"

                        // },

                        {

                            model: EvaluacionPeriodo,

                            as: "periodo"

                        }

                    ]

                }

            );

        if (!item) {

            return res.status(404).json({

                message:

                    "Asignación no encontrada."

            });

        }

        res.json(item);

    }

    catch (error) {

        console.error(error);

        res.status(500).json({

            message:

                "Error obteniendo asignación."

        });

    }

};

/*=========================================================
  CREAR ASIGNACION
=========================================================*/

export const crearAsignacion = async (req, res) => {

    try {

        const {

            empresa_id,

            sucursal_id,

            meta_id,

            empleado_id,

            supervisor_id,

            periodo_id,

            fecha_inicio,

            fecha_fin,

            valor_actual,

            porcentaje_cumplimiento,

            estado,

            observaciones

        } = req.body;

        const item =
            await EvaluacionMetaAsignacion.create({

                empresa_id,

                sucursal_id,

                meta_id,

                empleado_id,

                supervisor_id,

                periodo_id,

                fecha_inicio,

                fecha_fin,

                valor_actual,

                porcentaje_cumplimiento,

                estado,

                observaciones

            });

        res.status(201).json(

            item

        );

    }

    catch (error) {

        console.error(error);

        res.status(500).json({

            message:

                "Error creando asignación."

        });

    }

};

/*=========================================================
  ACTUALIZAR
=========================================================*/

export const actualizarAsignacion = async (req, res) => {

    try {

        const item =
            await EvaluacionMetaAsignacion.findByPk(

                req.params.id

            );

        if (!item) {

            return res.status(404).json({

                message:

                    "Asignación no encontrada."

            });

        }

        const {

            empresa_id,

            sucursal_id,

            meta_id,

            empleado_id,

            supervisor_id,

            periodo_id,

            fecha_inicio,

            fecha_fin,

            valor_actual,

            porcentaje_cumplimiento,

            estado,

            observaciones

        } = req.body;

        await item.update({

            empresa_id,

            sucursal_id,

            meta_id,

            empleado_id,

            supervisor_id,

            periodo_id,

            fecha_inicio,

            fecha_fin,

            valor_actual,

            porcentaje_cumplimiento,

            estado,

            observaciones

        });

        res.json(item);

    }

    catch (error) {

        console.error(error);

        res.status(500).json({

            message:

                "Error actualizando asignación."

        });

    }

};

/*=========================================================
  ELIMINAR
=========================================================*/

export const eliminarAsignacion = async (req, res) => {

    try {

        const item =
            await EvaluacionMetaAsignacion.findByPk(

                req.params.id

            );

        if (!item) {

            return res.status(404).json({

                message:

                    "Asignación no encontrada."

            });

        }

        await item.destroy();

        res.json({

            message:

                "Asignación eliminada."

        });

    }

    catch (error) {

        console.error(error);

        res.status(500).json({

            message:

                "Error eliminando asignación."

        });

    }

};

/*=========================================================
  ASIGNAR META
=========================================================*/

export const asignarMeta = async (req, res) => {

    try {

        const asignacion =
            await EvaluacionMetaAsignacion.findByPk(

                req.params.id

            );

        if (!asignacion) {

            return res.status(404).json({

                message: "Asignación no encontrada."

            });

        }

        if (asignacion.estado !== "BORRADOR") {

            return res.status(400).json({

                message: "Solo las metas en estado BORRADOR pueden asignarse."

            });

        }

        await asignacion.update({

            estado: "ASIGNADA"

        });

        res.json({

            message: "Meta asignada correctamente.",

            asignacion

        });

    } catch (error) {

        console.error(error);

        res.status(500).json({

            message: "Error asignando la meta."

        });

    }

};


/*=========================================================
  FINALIZAR META
=========================================================*/

export const finalizarAsignacion = async (req, res) => {

    try {

        const asignacion =
            await EvaluacionMetaAsignacion.findByPk(

                req.params.id

            );

        if (!asignacion) {

            return res.status(404).json({

                message: "Asignación no encontrada."

            });

        }

        if (

            asignacion.estado !== "ASIGNADA" &&

            asignacion.estado !== "EN_PROCESO"

        ) {

            return res.status(400).json({

                message: "La meta no puede finalizarse."

            });

        }

        await asignacion.update({

            estado: "CUMPLIDA"

        });

        res.json({

            message: "Meta finalizada correctamente.",

            asignacion

        });

    } catch (error) {

        console.error(error);

        res.status(500).json({

            message: "Error finalizando la meta."

        });

    }

};


/*=========================================================
  CANCELAR META
=========================================================*/

export const cancelarAsignacion = async (req, res) => {

    try {

        const asignacion =
            await EvaluacionMetaAsignacion.findByPk(

                req.params.id

            );

        if (!asignacion) {

            return res.status(404).json({

                message: "Asignación no encontrada."

            });

        }

        await asignacion.update({

            estado: "CANCELADA"

        });

        res.json({

            message: "Meta cancelada correctamente.",

            asignacion

        });

    } catch (error) {

        console.error(error);

        res.status(500).json({

            message: "Error cancelando la meta."

        });

    }

};

