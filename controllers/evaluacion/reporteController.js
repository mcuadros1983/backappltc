import {

    obtenerReporteCampanias

} from "../../services/evaluacion/reporteService.js";

export const obtenerReporteEvaluaciones = async (

    req,

    res

) => {

    try {

        const reporte =

            await obtenerReporteCampanias(

                req.query

            );

        res.json(

            reporte

        );

    }

    catch (error) {

        console.error(error);

        res.status(500).json({

            message:

                "Error al generar el reporte.",

            error:

                error.message

        });

    }

};