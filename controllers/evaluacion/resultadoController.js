import {

    obtenerResultadoCampania,
    obtenerComparativoCampanias

} from "../../services/evaluacion/resultadoService.js";

export const obtenerResultadoEvaluacion = async (

    req,

    res

) => {

    try {

        const { id } = req.params;

        const resultado =

            await obtenerResultadoCampania(

                id

            );

        if (!resultado.campania) {

            return res.status(404).json({

                message:

                    "La evaluación no existe."

            });

        }

        return res.json(

            resultado

        );

    }

    catch (error) {

        console.error(error);

        return res.status(500).json({

            message:

                "Error obteniendo el resultado de la evaluación."

        });

    }

};

export const obtenerComparativo = async (

    req,

    res

) => {

    try {

        const {

            evaluacion1,

            evaluacion2

        } = req.query;

        if (

            !evaluacion1 ||

            !evaluacion2

        ) {

            return res.status(400).json({

                message:

                    "Debe indicar ambas campañas."

            });

        }

        const resultado =

            await obtenerComparativoCampanias(

                Number(evaluacion1),

                Number(evaluacion2)

            );

        return res.json(

            resultado

        );

    }

    catch (error) {

        console.error(error);

        return res.status(500).json({

            message:

                "Error obteniendo el comparativo."

        });

    }

};