import {
    EVENTOS_EVALUACION
} from "./evaluacionEventos.js";

import evaluacionAnalisisService
    from "./evaluacionAnalisisService.js";


/*=========================================================
SUBSCRIBER
=========================================================*/

const evaluacionAnalisisSubscriber = {

    async process(evento) {

        switch (evento.codigo) {

            case EVENTOS_EVALUACION.RESPUESTA_REGISTRADA:

                await evaluacionAnalisisService.analizarRespuesta(

                    evento.datos.respuestaId

                );

                break;

            default:

                break;

        }

    }

};

export default evaluacionAnalisisSubscriber;