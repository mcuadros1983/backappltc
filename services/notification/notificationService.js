import emailService from "./emailService.js";
import templateService from "./templateService.js";

import NotificationHistory from "../../models/notification/notificationHistoryModel.js";
import NotificationRecipient from "../../models/notification/notificationRecipientModel.js";

import NotificationEvent from "../../models/notification/notificationEventModel.js";

/*=========================================================
  GUARDAR HISTORIAL
=========================================================*/

const guardarHistorial = async ({

    tipo,

    canal,

    destinatario,

    asunto,

    contenido,

    estado,

    error = null

}) => {

    return await NotificationHistory.create({

        tipo,

        canal,

        destinatario,

        asunto,

        contenido,

        estado,

        fecha_envio: new Date(),

        error

    });

};

/*=========================================================
  ENVIAR NOTIFICACIÓN
=========================================================*/

const send = async ({

    tipo,

    datos = {},

    canal = "EMAIL",

    attachments = []

}) => {

    try {

        /*=========================================
          RENDERIZAR PLANTILLA
        =========================================*/

        const plantilla =

            await templateService.render(

                tipo,

                datos

            );

        /*=========================================
          DESTINATARIOS DEL EVENTO
        =========================================*/

        const evento =
            await NotificationEvent.findOne({

                where: {

                    codigo: tipo,

                    activo: true

                }

            });

        if (!evento) {

            throw new Error(

                `El evento "${tipo}" no existe.`

            );

        }

        const destinatarios =
            await NotificationRecipient.findAll({

                where: {

                    evento_id: evento.id,

                    activo: true

                }

            });

        if (!destinatarios.length) {

            throw new Error(

                `No existen destinatarios configurados para el evento "${tipo}".`

            );

        }

        /*=========================================
          ENVÍO
        =========================================*/

        const resultados = [];

        for (const destinatario of destinatarios) {

            const resultado =

                await emailService.send({

                    to: destinatario.email,

                    subject: plantilla.subject,

                    html: plantilla.html,

                    text: plantilla.text,

                    attachments

                });

            await guardarHistorial({

                tipo,

                canal,

                destinatario: destinatario.email,

                asunto: plantilla.subject,

                contenido: plantilla.html,

                estado:

                    resultado.ok

                        ? "ENVIADO"

                        : "ERROR",

                error:

                    resultado.ok

                        ? null

                        : resultado.error

            });

            resultados.push({

                email: destinatario.email,

                ok: resultado.ok,

                error: resultado.error ?? null

            });

        }

        return {

            ok: true,

            enviados: resultados

        };

    }

    catch (error) {

        console.error(error);

        return {

            ok: false,

            error: error.message

        };

    }

};

/*=========================================================
  PROCESAR EVENTO
=========================================================*/

/*=========================================================
  PROCESAR EVENTO
=========================================================*/

const process = async (

    evento

) => {

    const configuracion =

        await NotificationEvent.findOne({

            where: {

                codigo: evento.codigo,

                activo: true

            }

        });

    if (!configuracion) {

        console.warn(

            `No existe configuración para el evento ${evento.codigo}.`

        );

        return;

    }

    /*=====================================================
      EMAIL
    =====================================================*/

    if (configuracion.email) {

        await send({

            tipo:

                evento.codigo,

            datos:

                evento.datos

        });

    }

    /*=====================================================
      NOTIFICACIÓN INTERNA
    =====================================================*/

    if (configuracion.interna) {

        /*
            Próximamente:

            await crearNotificacion(...)
        */

    }

    /*=====================================================
      WHATSAPP
    =====================================================*/

    if (configuracion.whatsapp) {

        /*
            Próximamente:

            await whatsappService.send(...)
        */

    }

    /*=====================================================
      DASHBOARD
    =====================================================*/

    if (configuracion.dashboard) {

        /*
            Próximamente:

            dashboardService.process(...)
        */

    }

    /*=====================================================
      AUDITORÍA
    =====================================================*/

    if (configuracion.auditoria) {

        /*
            Próximamente:

            auditService.process(...)
        */

    }

};

export default {
    process,

    send

};