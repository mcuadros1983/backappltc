import service from "../../services/evaluacion/evaluacionPublicService.js";

export const obtenerFormularioPublico = async (

    req,

    res

) => {

    try {

        const data =

            await service.obtenerFormulario(

                req.params.token_publico

            );

        res.json(data);

    }

    catch (error) {

        console.error(error);

        res.status(400).json({

            message:

                error.message

        });

    }

};