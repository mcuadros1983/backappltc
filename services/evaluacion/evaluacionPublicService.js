import Evaluacion from "../../models/evaluacion/evaluacionModel.js";

import EvaluacionTipo from "../../models/evaluacion/evaluacionTipoModel.js";
import EvaluacionPeriodo from "../../models/evaluacion/evaluacionPeriodoModel.js";
import EvaluacionPlantilla from "../../models/evaluacion/evaluacionPlantillaModel.js";
import EvaluacionPlantillaDetalle from "../../models/evaluacion/evaluacionPlantillaDetalleModel.js";
import EvaluacionCriterio from "../../models/evaluacion/evaluacionCriterioModel.js";

const obtenerFormulario = async (token) => {

    const evaluacion = await Evaluacion.findOne({

        where: {

            token_publico: token

        },

        include: [

            {

                model: EvaluacionTipo,

                as: "tipo"

            },

            {

                model: EvaluacionPeriodo,

                as: "periodo"

            },

            {

                model: EvaluacionPlantilla,

                as: "plantilla",

                include: [

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

        ]

    });

    if (!evaluacion) {

        throw new Error(

            "Formulario inexistente."

        );

    }

    return {

        id: evaluacion.id,

        numero: evaluacion.numero,

        observaciones: evaluacion.observaciones,

        tipo: evaluacion.tipo,

        periodo: evaluacion.periodo,

        plantilla: {

            id: evaluacion.plantilla.id,

            descripcion:

                evaluacion.plantilla.descripcion

        },

        criterios:

            evaluacion.plantilla.detalles

                .sort(

                    (a, b) =>

                        a.orden - b.orden

                )

                .map(detalle => ({

                    id:

                        detalle.criterio.id,

                    codigo:

                        detalle.criterio.codigo,

                    descripcion:

                        detalle.criterio.descripcion,

                    pregunta:

                        detalle.criterio.pregunta,

                    tipo_respuesta:

                        detalle.criterio.tipo_respuesta,

                    opciones:

                        detalle.criterio.opciones,

                    puntaje_maximo:

                        detalle.criterio.puntaje_maximo,

                    peso:

                        detalle.peso,

                    obligatorio:

                        detalle.obligatorio,

                    permite_comentario:

                        detalle.permite_comentario,

                    permite_evidencia:

                        detalle.permite_evidencia,

                    orden:

                        detalle.orden

                }))

    };

};

export default {

    obtenerFormulario

};