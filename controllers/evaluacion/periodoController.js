import EvaluacionPeriodo from "../../models/evaluacion/evaluacionPeriodoModel.js";
import { Op } from "sequelize";
/* ===========================================================
   PERIODOS
=========================================================== */

export const listarPeriodos = async (req, res) => {

    try {

        const rows = await EvaluacionPeriodo.findAll({

            order: [
                ["fecha_inicio", "DESC"]
            ]

        });

        res.json(rows);

    } catch (error) {

        console.error(error);

        res.status(500).json(error);

    }

};



export const obtenerPeriodo = async (req, res) => {

    try {

        const row =
            await EvaluacionPeriodo.findByPk(
                req.params.id
            );

        if (!row) {

            return res.status(404).json({

                message:
                    "Período no encontrado"

            });

        }

        res.json(row);

    } catch (error) {

        console.error(error);

        res.status(500).json(error);

    }

};



export const crearPeriodo = async (req, res) => {

    try {

        const {

            descripcion,

            fecha_inicio,

            fecha_fin,

            activo

        } = req.body;

        if (!descripcion) {
            return res.status(400).json({
                message: "La descripción es obligatoria."
            });
        }

        if (!fecha_inicio) {
            return res.status(400).json({
                message: "La fecha de inicio es obligatoria."
            });
        }

        if (!fecha_fin) {
            return res.status(400).json({
                message: "La fecha de fin es obligatoria."
            });
        }

        if (new Date(fecha_fin) < new Date(fecha_inicio)) {

            return res.status(400).json({

                message:
                    "La fecha de fin no puede ser menor que la fecha de inicio."

            });

        }

        const existe =
            await EvaluacionPeriodo.findOne({

                where: {

                    descripcion

                }

            });

        if (existe) {

            return res.status(400).json({

                message:
                    "Ya existe un período con esa descripción."

            });

        }

        const row =
            await EvaluacionPeriodo.create({

                descripcion,

                fecha_inicio,

                fecha_fin,

                activo

            });

        res.status(201).json(row);

    } catch (error) {

        console.error(error);

        res.status(500).json(error);

    }

};



export const actualizarPeriodo = async (req, res) => {

    try {

        const row =
            await EvaluacionPeriodo.findByPk(
                req.params.id
            );

        if (!row) {

            return res.status(404).json({

                message:
                    "Período no encontrado"

            });

        }

        const {

            descripcion,

            fecha_inicio,

            fecha_fin,

            activo

        } = req.body;

        await row.update({

            descripcion,

            fecha_inicio,

            fecha_fin,

            activo

        });

        res.json({

            ok: true,

            message:
                "Período actualizado"

        });

    } catch (error) {

        console.error(error);

        res.status(500).json(error);

    }

};



export const eliminarPeriodo = async (req, res) => {

    try {

        const row =
            await EvaluacionPeriodo.findByPk(
                req.params.id
            );

        if (!row) {

            return res.status(404).json({

                message:
                    "Período no encontrado"

            });

        }

        await row.destroy();

        res.json({

            ok: true,

            message:
                "Período eliminado"

        });

    } catch (error) {

        console.error(error);

        res.status(500).json(error);

    }

};