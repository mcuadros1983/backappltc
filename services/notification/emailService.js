import nodemailer from "nodemailer";

import NotificationConfig from "../../models/notification/notificationConfigModel.js";

/*=========================================================
  TRANSPORTER SMTP
=========================================================*/

let transporter = null;

let transporterConfigId = null;

/*=========================================================
  OBTENER CONFIGURACIÓN SMTP
=========================================================*/

const obtenerConfiguracion = async () => {

    const configuracion =
        await NotificationConfig.findOne({

            where: {

                activo: true

            }

        });

    if (!configuracion) {

        throw new Error(

            "No existe una configuración SMTP activa."

        );

    }

    return configuracion;

};

/*=========================================================
  CREAR TRANSPORTER
=========================================================*/

const crearTransporter = async () => {

    const configuracion =
        await obtenerConfiguracion();

    if (

        transporter &&

        transporterConfigId === configuracion.id

    ) {

        return transporter;

    }

    transporter =
        nodemailer.createTransport({

            host:

                configuracion.smtp_host,

            port:

                configuracion.smtp_port,

            secure:

                configuracion.smtp_secure,

            auth: {

                user:

                    configuracion.smtp_user,

                pass:

                    configuracion.smtp_password

            }

        });

    transporterConfigId =
        configuracion.id;

    return transporter;

};

/*=========================================================
  ENVIAR CORREO
=========================================================*/

const send = async ({

    to,

    subject,

    html = null,

    text = null,

    attachments = []

}) => {

    try {

        const smtp =
            await crearTransporter();

        const configuracion =
            await obtenerConfiguracion();

        const info =
            await smtp.sendMail({

                from: `"${configuracion.remitente_nombre}" <${configuracion.remitente_email}>`,

                replyTo:

                    configuracion.responder_email ||

                    configuracion.remitente_email,

                to,

                subject,

                html,

                text,

                attachments

            });

        return {

            ok: true,

            messageId:

                info.messageId,

            response:

                info.response

        };

    }

    catch (error) {

        console.error(error);

        return {

            ok: false,

            error:

                error.message

        };

    }

};

/*=========================================================
  PROBAR CONEXIÓN SMTP
=========================================================*/

const testConnection = async () => {

    try {

        const smtp =
            await crearTransporter();

        await smtp.verify();

        return {

            ok: true,

            message:

                "Conexión SMTP correcta."

        };

    }

    catch (error) {

        console.error(error);

        return {

            ok: false,

            message:

                error.message

        };

    }

};

export default {

    send,

    testConnection

};