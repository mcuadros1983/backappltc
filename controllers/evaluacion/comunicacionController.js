import EvaluacionComunicacion
from "../../models/evaluacion/evaluacionComunicacionModel.js";

/*=========================================================
  LISTAR
=========================================================*/

export const listarComunicaciones = async (req, res) => {

    try {

        const items =
            await EvaluacionComunicacion.findAll({

                order: [

                    ["createdAt", "DESC"]

                ]

            });

        res.json(items);

    }

    catch (error) {

        console.error(error);

        res.status(500).json({

            message:

                "Error obteniendo comunicaciones."

        });

    }

};

/*=========================================================
  OBTENER
=========================================================*/

export const obtenerComunicacion = async (req, res) => {

    try {

        const item =
            await EvaluacionComunicacion.findByPk(

                req.params.id

            );

        if (!item) {

            return res.status(404).json({

                message:

                    "Comunicación no encontrada."

            });

        }

        res.json(item);

    }

    catch (error) {

        console.error(error);

        res.status(500).json({

            message:

                "Error obteniendo comunicación."

        });

    }

};