import EvaluacionPlantilla from "../../models/evaluacion/evaluacionPlantillaModel.js";
import EvaluacionTipo from "../../models/evaluacion/evaluacionTipoModel.js";
import EvaluacionPlantillaDetalle from "../../models/evaluacion/evaluacionPlantillaDetalleModel.js";
import EvaluacionCriterio from "../../models/evaluacion/evaluacionCriterioModel.js";
// import EvaluacionPlantillaDetalle from "../../models/evaluacion/evaluacionPlantillaDetalleModel.js";
// import EvaluacionCriterio from "../../models/evaluacion/evaluacionCriterioModel.js";
import { Op } from "sequelize";
/* ===========================================================
   PLANTILLAS
=========================================================== */

export const eliminarDetallePlantilla = async (req, res) => {

    try {

        const detalle =
            await EvaluacionPlantillaDetalle.findByPk(
                req.params.id
            );

        if (!detalle) {

            return res.status(404).json({

                message: "Detalle no encontrado",

            });

        }

        await detalle.destroy();

        res.json({

            ok: true,

            message: "Detalle eliminado",

        });

    } catch (error) {

        console.error(error);

        res.status(500).json(error);

    }

};

export const actualizarDetallePlantilla = async (req, res) => {

    try {

        const detalle =
            await EvaluacionPlantillaDetalle.findByPk(
                req.params.id
            );

        if (!detalle) {

            return res.status(404).json({

                message: "Detalle no encontrado",

            });

        }

        await detalle.update({

            criterio_id: req.body.criterio_id,

            orden: req.body.orden,

            peso: req.body.peso,

            obligatorio: req.body.obligatorio,

            permite_comentario: req.body.permite_comentario,

            permite_evidencia: req.body.permite_evidencia,

        });

        res.json({

            ok: true,

            message: "Detalle actualizado",

        });

    } catch (error) {

        console.error(error);

        res.status(500).json(error);

    }

};


export const agregarDetallePlantilla = async (req, res) => {

    try {

        const plantilla = await EvaluacionPlantilla.findByPk(req.params.id);

        if (!plantilla) {

            return res.status(404).json({
                message: "Plantilla no encontrada"
            });

        }

        const detalle = await EvaluacionPlantillaDetalle.create({

            plantilla_id: req.params.id,

            criterio_id: req.body.criterio_id,

            orden: req.body.orden,

            peso: req.body.peso,

            obligatorio: req.body.obligatorio,

            permite_comentario: req.body.permite_comentario,

            permite_evidencia: req.body.permite_evidencia,

        });

        res.status(201).json(detalle);

    } catch (error) {

        console.error(error);
        res.status(500).json(error);

    }

};

export const obtenerDetallePlantilla = async (req, res) => {

    try {

        const plantilla = await EvaluacionPlantilla.findByPk(
            req.params.id,
            {
                include: [
                    {
                        model: EvaluacionTipo,
                        as: "tipo",
                    },
                    {
                        model: EvaluacionPlantillaDetalle,
                        as: "detalles",
                        include: [
                            {
                                model: EvaluacionCriterio,
                                as: "criterio",
                            },
                        ],
                    },
                ],
                order: [
                    [
                        {
                            model: EvaluacionPlantillaDetalle,
                            as: "detalles",
                        },
                        "orden",
                        "ASC",
                    ],
                ],
            }
        );

        if (!plantilla) {
            return res.status(404).json({
                message: "Plantilla no encontrada",
            });
        }

        res.json(plantilla);

    } catch (error) {

        console.error(error);
        res.status(500).json(error);

    }

};

export const listarPlantillas = async (req, res) => {

    try {

        const rows = await EvaluacionPlantilla.findAll({

            include: [

                {
                    model: EvaluacionTipo,
                    as: "tipo",
                    attributes: [
                        "id",
                        "descripcion"
                    ]
                }

            ],

            order: [
                ["descripcion", "ASC"]
            ]

        });

        const data = rows.map(item => ({

            id: item.id,

            codigo: item.codigo,

            descripcion: item.descripcion,

            tipo_id: item.tipo_id,

            tipo: item.tipo,

            activo: item.activo,

            created_at: item.created_at,

            updated_at: item.updated_at

        }));

        res.json(data);

    } catch (error) {

        console.error(error);

        res.status(500).json(error);

    }

};



export const obtenerPlantilla = async (req, res) => {

    try {

        const row = await EvaluacionPlantilla.findByPk(

            req.params.id,

            {

                include: [

                    {
                        model: EvaluacionTipo,
                        as: "tipo"
                    },

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

        if (!row) {

            return res.status(404).json({

                message: "Plantilla no encontrada"

            });

        }

        res.json(row);

    } catch (error) {

        console.error(error);

        res.status(500).json(error);

    }

};



export const crearPlantilla = async (req, res) => {

    const transaction =
        await EvaluacionPlantilla.sequelize.transaction();

    try {

        const {

            codigo,

            descripcion,

            tipo_id,

            activo,

            detalles = []

        } = req.body;

        const existe =
            await EvaluacionPlantilla.findOne({

                where: {
                    codigo
                },

                transaction

            });

        if (existe) {

            await transaction.rollback();

            return res.status(400).json({

                message:
                    "Ya existe una plantilla con ese código."

            });

        }

        const plantilla =
            await EvaluacionPlantilla.create(

                {

                    codigo,

                    descripcion,

                    tipo_id,

                    activo

                },

                { transaction }

            );

        if (detalles.length) {

            await EvaluacionPlantillaDetalle.bulkCreate(

                detalles.map(item => ({

                    plantilla_id: plantilla.id,

                    criterio_id: item.criterio_id,

                    orden: item.orden ?? 1,

                    peso:
                        item.peso ?? 1,

                    obligatorio:
                        item.obligatorio ?? true,

                    permite_comentario:
                        item.permite_comentario ?? true,

                    permite_evidencia:
                        item.permite_evidencia ?? false

                })),

                { transaction }

            );

        }

        await transaction.commit();

        res.status(201).json(plantilla);

    } catch (error) {

        await transaction.rollback();

        console.error(error);

        res.status(500).json(error);

    }

};



export const actualizarPlantilla = async (req, res) => {

    const transaction =
        await EvaluacionPlantilla.sequelize.transaction();

    try {

        const plantilla =
            await EvaluacionPlantilla.findByPk(

                req.params.id,

                { transaction }

            );

        if (!plantilla) {

            await transaction.rollback();

            return res.status(404).json({

                message:
                    "Plantilla no encontrada"

            });

        }

        const {

            codigo,

            descripcion,

            tipo_id,

            activo,

            detalles = []

        } = req.body;

        const existe =
            await EvaluacionPlantilla.findOne({

                where: {

                    codigo,

                    id: {
                        [Op.ne]: plantilla.id
                    }

                },

                transaction

            });

        if (existe) {

            await transaction.rollback();

            return res.status(400).json({

                message:
                    "Ya existe otra plantilla con ese código."

            });

        }

        await plantilla.update(

            {

                codigo,

                descripcion,

                tipo_id,

                activo

            },

            { transaction }

        );

        await EvaluacionPlantillaDetalle.destroy({

            where: {

                plantilla_id:
                    plantilla.id

            },

            transaction

        });

        if (detalles.length) {

            await EvaluacionPlantillaDetalle.bulkCreate(

                detalles.map(item => ({

                    plantilla_id: plantilla.id,

                    criterio_id: item.criterio_id,

                    orden: item.orden ?? 1,

                    peso: item.peso ?? 1,

                    obligatorio:
                        item.obligatorio ?? true,

                    permite_comentario:
                        item.permite_comentario ?? true,

                    permite_evidencia:
                        item.permite_evidencia ?? false

                })),

                { transaction }

            );

        }

        await transaction.commit();

        res.json({

            ok: true,

            message:
                "Plantilla actualizada"

        });

    } catch (error) {

        await transaction.rollback();

        console.error(error);

        res.status(500).json(error);

    }

};



export const eliminarPlantilla = async (req, res) => {

    const transaction =
        await EvaluacionPlantilla.sequelize.transaction();

    try {

        const plantilla =
            await EvaluacionPlantilla.findByPk(

                req.params.id,

                { transaction }

            );

        if (!plantilla) {

            await transaction.rollback();

            return res.status(404).json({

                message:
                    "Plantilla no encontrada"

            });

        }

        await EvaluacionPlantillaDetalle.destroy({

            where: {

                plantilla_id:
                    plantilla.id

            },

            transaction

        });

        await plantilla.destroy({

            transaction

        });

        await transaction.commit();

        res.json({

            ok: true,

            message:
                "Plantilla eliminada"

        });

    } catch (error) {

        await transaction.rollback();

        console.error(error);

        res.status(500).json(error);

    }

};