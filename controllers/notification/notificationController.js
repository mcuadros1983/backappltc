import NotificationHistory from "../../models/notification/notificationHistoryModel.js";

import notificationService from "../../services/notification/notificationService.js";

/*=========================================================
  ENVIAR NOTIFICACIÓN
=========================================================*/

export const enviarNotificacion = async (req, res) => {

    try {

        const resultado =
            await notificationService.send(

                req.body

            );

        if (!resultado.ok) {

            return res.status(400).json(resultado);

        }

        res.json(resultado);

    }

    catch (error) {

        console.error(error);

        res.status(500).json({

            message:

                "Error enviando la notificación."

        });

    }

};

/*=========================================================
  LISTAR HISTORIAL
=========================================================*/

export const listarHistorial = async (req, res) => {

    try {

        const items =
            await NotificationHistory.findAll({

                order: [

                    [

                        "created_at",

                        "DESC"

                    ]

                ]

            });

        res.json(items);

    }

    catch (error) {

        console.error(error);

        res.status(500).json({

            message:

                "Error obteniendo el historial."

        });

    }

};

/*=========================================================
  OBTENER HISTORIAL
=========================================================*/

export const obtenerHistorial = async (req, res) => {

    try {

        const { id } = req.params;

        const item =
            await NotificationHistory.findByPk(id);

        if (!item) {

            return res.status(404).json({

                message:

                    "Registro no encontrado."

            });

        }

        res.json(item);

    }

    catch (error) {

        console.error(error);

        res.status(500).json({

            message:

                "Error obteniendo el historial."

        });

    }

};