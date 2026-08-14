import nodemailer from "nodemailer";

const transporter =
    nodemailer.createTransport({

        host:
            process.env.SMTP_HOST,

        port:
            Number(process.env.SMTP_PORT),

        secure:
            process.env.SMTP_SECURE === "true",

        auth: {

            user:
                process.env.SMTP_USER,

            pass:
                process.env.SMTP_PASSWORD

        }

    });

export const enviar = async ({

    to,

    subject,

    html,

    text

}) => {

    const destinatarios =
        Array.isArray(to)

            ? to.filter(Boolean)

            : [to].filter(Boolean);

    if (

        destinatarios.length === 0

    ) {

        return false;

    }

    if (!subject) {

        throw new Error(

            "El asunto del correo es obligatorio."

        );

    }

    if (

        !html &&

        !text

    ) {

        throw new Error(

            "El contenido del correo es obligatorio."

        );

    }

    await transporter.sendMail({

        from:
            process.env.SMTP_FROM,

        to:
            destinatarios,

        subject,

        html,

        text

    });

    return true;

};

export const verificarConexion = async () => {

    await transporter.verify();

    return true;

};