
import EvaluacionCriterio from "../../models/evaluacion/evaluacionCriterioModel.js";

/* ===========================================================
   CRITERIOS
=========================================================== */

export const listarCriterios = async (req, res) => {

    try {

        const rows = await EvaluacionCriterio.findAll({

            order: [
                ["orden", "ASC"],
                ["descripcion", "ASC"]
            ]

        });

        res.json(rows);

    } catch (error) {

        console.error(error);

        res.status(500).json(error);

    }

};



export const obtenerCriterio = async (req, res) => {

    try {

        const row =
            await EvaluacionCriterio.findByPk(
                req.params.id
            );

        if (!row) {

            return res.status(404).json({

                message:
                    "Criterio no encontrado"

            });

        }

        res.json(row);

    } catch (error) {

        console.error(error);

        res.status(500).json(error);

    }

};



export const crearCriterio = async (req, res) => {

    try {

        const {

            codigo,

            descripcion,

            pregunta,

            tipo_respuesta,

            opciones,

            puntaje_maximo,

            orden,

            activo

        } = req.body;

        const existe =
            await EvaluacionCriterio.findOne({

                where: {
                    codigo
                }

            });

        if (existe) {

            return res.status(400).json({

                message:
                    "Ya existe un criterio con ese código."

            });

        }

        const row =
            await EvaluacionCriterio.create({

                codigo,

                descripcion,

                pregunta,

                tipo_respuesta,

                opciones,

                puntaje_maximo,

                orden,

                activo

            });

        res.status(201).json(row);

    } catch (error) {

        console.error(error);

        res.status(500).json(error);

    }

};



export const actualizarCriterio = async (req, res) => {

    try {

        const row =
            await EvaluacionCriterio.findByPk(
                req.params.id
            );

        if (!row) {

            return res.status(404).json({

                message:
                    "Criterio no encontrado"

            });

        }

        const {

            codigo,

            descripcion,

            pregunta,

            tipo_respuesta,

            opciones,
            
            puntaje_maximo,

            orden,

            activo

        } = req.body;

        const existe =
            await EvaluacionCriterio.findOne({

                where: {
                    codigo
                }

            });

        if (

            existe &&

            existe.id !== row.id

        ) {

            return res.status(400).json({

                message:
                    "Ya existe un criterio con ese código."

            });

        }

        await row.update({

            codigo,

            descripcion,

            pregunta,

            tipo_respuesta,

            opciones,

            puntaje_maximo,

            orden,

            activo

        });

        res.json({

            ok: true,

            message:
                "Criterio actualizado"

        });

    } catch (error) {

        console.error(error);

        res.status(500).json(error);

    }

};



export const eliminarCriterio = async (req, res) => {

    try {

        const row =
            await EvaluacionCriterio.findByPk(
                req.params.id
            );

        if (!row) {

            return res.status(404).json({

                message:
                    "Criterio no encontrado"

            });

        }

        await row.destroy();

        res.json({

            ok: true,

            message:
                "Criterio eliminado"

        });

    } catch (error) {

        console.error(error);

        res.status(500).json(error);

    }

};