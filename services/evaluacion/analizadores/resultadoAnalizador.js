import CONFIG from "../evaluacionAnalisisConfig.js";

import {
    EVENTOS_EVALUACION
} from "../evaluacionEventos.js";

const analizar = (porcentaje = 0) => {

    const eventos = [];

    const valor = Number(

        porcentaje || 0

    );

    if (

        valor <

        CONFIG.UMBRALES.ALERTA_ROJA

    ) {

        eventos.push({

            publicar: true,

            evento:

                EVENTOS_EVALUACION.ALERTA_ROJA,

            nivel:

                CONFIG.NIVELES.ALERTA_ROJA,
            riesgo:

                CONFIG.PUNTAJES_RIESGO
                    .ALERTA_ROJA,

            anterior: null,

            actual: null,

            diferencia: null

        });

    }

    else if (

        valor <

        CONFIG.UMBRALES.BANDERA_CRITICA

    ) {

        eventos.push({

            publicar: true,

            evento:

                EVENTOS_EVALUACION.BANDERA_CRITICA,

            nivel:

                CONFIG.NIVELES.BANDERA_CRITICA,
            riesgo:

                CONFIG.PUNTAJES_RIESGO
                    .BANDERA_CRITICA,

            anterior: null,

            actual: null,

            diferencia: null

        });

    }

    return eventos;

};

export default {

    analizar

};