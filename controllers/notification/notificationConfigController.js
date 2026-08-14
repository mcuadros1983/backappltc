import NotificationConfig from "../../models/notification/notificationConfigModel.js";

import emailService from "../../services/notification/emailService.js";

/*=========================================================
  OBTENER CONFIGURACIÓN SMTP
=========================================================*/

export const obtenerConfiguracion = async (req, res) => {

    try {

        const configuracion =
            await NotificationConfig.findOne({

                where: {

                    activo: true

                }

            });

        if (!configuracion) {

            return res.status(404).json({

                message:
                    "No existe una configuración SMTP."

            });

        }

        res.json(configuracion);

    }

    catch (error) {

        console.error(error);

        res.status(500).json({

            message:
                "Error obteniendo la configuración SMTP."

        });

    }

};

/*=========================================================
  GUARDAR CONFIGURACIÓN SMTP
=========================================================*/

export const guardarConfiguracion = async (req, res) => {

    const transaction =
        await NotificationConfig.sequelize.transaction();

    try {

        let configuracion =
            await NotificationConfig.findOne({

                where: {

                    activo: true

                },

                transaction

            });

        if (configuracion) {

            await configuracion.update(

                req.body,

                {

                    transaction

                }

            );

        }

        else {

            configuracion =
                await NotificationConfig.create(

                    req.body,

                    {

                        transaction

                    }

                );

        }

        await transaction.commit();

        res.json({

            ok: true,

            configuracion

        });

    }

    catch (error) {

        await transaction.rollback();

        console.error(error);

        res.status(500).json({

            message:
                "Error guardando la configuración SMTP."

        });

    }

};

/*=========================================================
  PROBAR CONEXIÓN SMTP
=========================================================*/

export const probarConexion = async (req, res) => {

    try {

        const resultado =
            await emailService.testConnection();

        if (!resultado.ok) {

            return res.status(400).json(resultado);

        }

        res.json(resultado);

    }

    catch (error) {

        console.error(error);

        res.status(500).json({

            message:
                "Error verificando la conexión SMTP."

        });

    }

};