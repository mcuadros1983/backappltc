import { Op } from "sequelize";

import Evaluacion from "../../models/evaluacion/evaluacionModel.js";

import eventService from "../events/eventService.js";

/*=========================================================
  OBTENER AUTOEVALUACIONES PENDIENTES
=========================================================*/

const obtenerPendientes = async () => {

    return await Evaluacion.findAll({

        where: {

            estado: "PENDIENTE"

        }

    });

};

/*=========================================================
  VALIDAR SI ESTÁ VENCIDA
=========================================================*/

const esEvaluacionVencida = (

    evaluacion

) => {

    if (!evaluacion.fecha) {

        return false;

    }

    return new Date(

        evaluacion.fecha

    ) < new Date();

};

/*=========================================================
  PUBLICAR EVENTO
=========================================================*/

const publicarEvento = async (

    evaluacion

) => {

    await eventService.publish({

        codigo:

            "AUTOEVALUACION_VENCIDA",

        modulo:

            "EVALUACION",

        entidad:

            "Evaluacion",

        entidad_id:

            evaluacion.id,

        accion:

            "VENCIMIENTO",

        usuario_id:

            null,

        sucursal_id:

            null,

        fecha:

            new Date(),

        datos: {

            numero:

                evaluacion.numero,

            evaluacion_id:

                evaluacion.id

        }

    });

};

/*=========================================================
  ACTUALIZAR ESTADO
=========================================================*/

const actualizarEstado = async (

    evaluacion

) => {

    await evaluacion.update({

        estado:

            "VENCIDA"

    });

};

/*=========================================================
  PROCESAR AUTOEVALUACIONES
=========================================================*/

const procesarAutoevaluaciones = async () => {

    let procesados = 0;

    let notificados = 0;

    const evaluaciones =

        await obtenerPendientes();

    for (

        const evaluacion

        of evaluaciones

    ) {

        if (

            !esEvaluacionVencida(

                evaluacion

            )

        ) {

            continue;

        }

        procesados++;

        await publicarEvento(

            evaluacion

        );

        await actualizarEstado(

            evaluacion

        );

        notificados++;

    }

    return {

        procesados,

        notificados

    };

};

export default {

    procesarAutoevaluaciones,

    obtenerPendientes,

    esEvaluacionVencida,

    publicarEvento,

    actualizarEstado

};