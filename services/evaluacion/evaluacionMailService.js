import {
    obtenerConfiguracion
} from "./evaluacionNotificacionService.js";

import {
    enviar
} from "../mail/mailService.js";

import {
    CONFIGURACION_POR_EVENTO
} from "./evaluacionEventos.js";

import {
    obtenerTemplateEvaluacion
} from "./templates/index.js";

const obtenerDestinatarios = (configuracion) => {

    return [

        configuracion.mail_1,

        configuracion.mail_2,

        configuracion.mail_3

    ]
        .map(mail => mail?.trim())
        .filter(Boolean)
        .filter(
            (mail, index, lista) =>
                lista.indexOf(mail) === index
        );

};
export const enviarAlerta = async (

    evento,

    datos = {}

) => {

    const campoConfiguracion =
        CONFIGURACION_POR_EVENTO[evento];

    if (!campoConfiguracion) {

        throw new Error(

            `El evento de evaluación ${evento} no está configurado.`

        );

    }

    if (!evento) {
        throw new Error("Debe indicar el evento de evaluación.");
    }

    const configuracion =
        await obtenerConfiguracion();


    if (!configuracion.smtp_host) {

        throw new Error(
            "La configuración SMTP no está completa."
        );

    }

    if (!configuracion) {

        throw new Error(

            "No existe configuración de notificaciones de Evaluación."

        );

    }

    if (

        configuracion[campoConfiguracion] !== true

    ) {

        return {

            enviado: false,

            motivo:
                "EVENTO_DESACTIVADO"

        };

    }

    const destinatarios =
        obtenerDestinatarios(configuracion);

    if (

        destinatarios.length === 0

    ) {

        return {

            enviado: false,

            motivo:
                "SIN_DESTINATARIOS"

        };

    }

    const template =
        obtenerTemplateEvaluacion(evento);

    if (!template) {

        throw new Error(

            `No existe una plantilla de correo para el evento ${evento}.`

        );

    }

    const mail =
        template(datos);

    if (

        !mail ||

        !mail.subject ||

        !mail.html

    ) {

        throw new Error(

            `La plantilla del evento ${evento} devolvió un formato inválido.`

        );

    }
    await enviar({

        to:
            destinatarios,

        subject:
            mail.subject,

        html:
            mail.html,

        text:
            mail.text

    });

    console.info(
        `[Evaluación] Correo enviado (${evento})`,
        destinatarios
    );

    return {

        enviado: true,

        evento,

        destinatarios,

        totalDestinatarios:
            destinatarios.length

    };

};

export const enviarMailPrueba = async () => {

    const configuracion =
        await obtenerConfiguracion();

    const destinatarios =
        obtenerDestinatarios(configuracion);

    if (

        destinatarios.length === 0

    ) {

        throw new Error(

            "Debe configurar al menos un correo destinatario."

        );

    }

    await enviar({

        to:
            destinatarios,

        subject:
            "Prueba de notificaciones - Evaluación",

        html: `
            <h2>Notificaciones de Evaluación</h2>

            <p>
                La configuración SMTP y los destinatarios
                funcionan correctamente.
            </p>

            <p>
                Este mensaje fue generado por el ERP La Tradición.
            </p>
        `,

        text:
            "La configuración SMTP y los destinatarios de Evaluación funcionan correctamente."

    });

    return {

        enviado: true,

        destinatarios

    };

};