import EvaluacionConfiguracion from "../../models/evaluacion/evaluacionConfiguracionModel.js";

/*=========================================================
OBTENER CONFIGURACIÓN GENERAL
=========================================================*/

export const obtenerConfiguracion = async (req, res) => {

    try {

        let configuracion =
            await EvaluacionConfiguracion.findByPk(1);

        if (!configuracion) {

            configuracion =
                await EvaluacionConfiguracion.create({

                    id: 1

                });

        }

        res.json(configuracion);

    }

    catch (error) {

        console.error(error);

        res.status(500).json({

            message: "Error al obtener la configuración."

        });

    }

};

/*=========================================================
GUARDAR CONFIGURACIÓN GENERAL
=========================================================*/

export const guardarConfiguracion = async (req, res) => {

    try {

        let configuracion =
            await EvaluacionConfiguracion.findByPk(1);

        if (!configuracion) {

            configuracion =
                await EvaluacionConfiguracion.create({

                    id: 1,

                    ...req.body

                });

            return res.json(configuracion);

        }

        await configuracion.update(

            req.body

        );

        res.json(configuracion);

    }

    catch (error) {

        console.error(error);

        res.status(500).json({

            message: "Error al guardar la configuración."

        });

    }

};