import { sequelize } from "../../config/database.js";

import Evaluacion from "../../models/evaluacion/evaluacionModel.js";
import EvaluacionRespuesta from "../../models/evaluacion/evaluacionRespuestaModel.js";
import EvaluacionRespuestaDetalle from "../../models/evaluacion/evaluacionRespuestaDetalleModel.js";

import EvaluacionPlantillaDetalle from "../../models/evaluacion/evaluacionPlantillaDetalleModel.js";
import eventService from "../events/eventService.js";

import {
    EVENTOS_EVALUACION
} from "./evaluacionEventos.js";

export const responderFormulario = async (
    token,
    data
) => {

    // console.log("responderFormulario - token:", token, data);

    const transaction = await sequelize.transaction();

    try {

        const evaluacion = await Evaluacion.findOne({

            where: {

                token_publico: token

            },

            transaction

        });

        if (!evaluacion) {

            throw new Error(
                "La campaña no existe."
            );

        }

        const hoy = new Date();

        if (

            evaluacion.fecha_inicio &&
            hoy < new Date(evaluacion.fecha_inicio)

        ) {

            throw new Error(
                "La campaña todavía no comenzó."
            );

        }

        if (

            evaluacion.fecha_fin &&
            hoy > new Date(evaluacion.fecha_fin)

        ) {

            throw new Error(
                "La campaña ya finalizó."
            );

        }

        const respuesta = await EvaluacionRespuesta.create({

            evaluacion_id: evaluacion.id,

            empleado_id: data.empleado_id,

            evaluador_id:

                data.evaluador_id || null,

            tipo_respuesta:

                data.tipo_respuesta,

            observaciones:

                data.observaciones || null

        }, {

            transaction

        });

        let puntajeTotal = 0;

        let puntajeMaximo = 0;

        for (const item of data.respuestas) {

            const detallePlantilla =
                await EvaluacionPlantillaDetalle.findOne({

                    where: {

                        plantilla_id:
                            evaluacion.plantilla_id,

                        criterio_id:
                            item.criterio_id

                    },

                    transaction

                });

            const peso = Number(

                detallePlantilla?.peso || 1

            );

            const puntaje =

                Number(item.valor) * peso;

            puntajeTotal += puntaje;

            puntajeMaximo +=

                Number(5) * peso;

            await EvaluacionRespuestaDetalle.create({

                respuesta_id:
                    respuesta.id,

                criterio_id:
                    item.criterio_id,

                valor:
                    item.valor,

                comentario:
                    item.comentario || null,

                evidencia:
                    null,

                puntaje

            }, {

                transaction

            });

        }

        respuesta.puntaje_total =
            puntajeTotal;

        respuesta.porcentaje =
            puntajeMaximo === 0
                ? 0
                : (puntajeTotal * 100) / puntajeMaximo;

        await respuesta.save({

            transaction

        });

        await transaction.commit();

        await eventService.publish({

            codigo:

                EVENTOS_EVALUACION.RESPUESTA_REGISTRADA,

            datos: {

                respuestaId: respuesta.id

            }

        });

        return respuesta;

    }

    catch (error) {

        await transaction.rollback();

        throw error;

    }

};