import {

    responderFormulario

} from "../../services/evaluacion/evaluacionRespuestaService.js";

export const responderEvaluacionPublica = async (

    req,

    res

) => {

    try {

        // console.log("responderEvaluacionPublica - token:", req.params.token);

        const respuesta =

            await responderFormulario(

                req.params.token,

                req.body

            );

        res.status(201).json({

            success: true,

            message:

                "Evaluación registrada correctamente.",

            data: respuesta

        });

    }

    catch (error) {

        console.error(error);

        res.status(400).json({

            success: false,

            message:

                error.message

        });

    }

};