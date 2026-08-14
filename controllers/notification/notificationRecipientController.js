import NotificationRecipient from "../../models/notification/notificationRecipientModel.js";
import NotificationEvent from "../../models/notification/notificationEventModel.js";

/*=========================================================
  LISTAR DESTINATARIOS
=========================================================*/

export const listarDestinatarios = async (req, res) => {

    try {

        const items =
            await NotificationRecipient.findAll({

                include: [

                    {

                        model: NotificationEvent,

                        as: "evento"

                    }

                ],

                order: [

                    [

                        {

                            model: NotificationEvent,

                            as: "evento"

                        },

                        "nombre",

                        "ASC"

                    ],

                    ["nombre", "ASC"]

                ]

            });

        res.json(items);

    }

    catch (error) {

        console.error(error);

        res.status(500).json({

            message:

                "Error obteniendo los destinatarios."

        });

    }

};

/*=========================================================
  OBTENER DESTINATARIO
=========================================================*/

export const obtenerDestinatario = async (req, res) => {

    try {

        const { id } = req.params;

        const item =
            await NotificationRecipient.findByPk(

                id,

                {

                    include: [

                        {

                            model: NotificationEvent,

                            as: "evento"

                        }

                    ]

                }

            );

        if (!item) {

            return res.status(404).json({

                message:

                    "Destinatario no encontrado."

            });

        }

        res.json(item);

    }

    catch (error) {

        console.error(error);

        res.status(500).json({

            message:

                "Error obteniendo el destinatario."

        });

    }

};

/*=========================================================
  CREAR DESTINATARIO
=========================================================*/

export const crearDestinatario = async (req, res) => {

    const transaction =
        await NotificationRecipient.sequelize.transaction();

    try {

        const item =
            await NotificationRecipient.create(

                req.body,

                {

                    transaction

                }

            );

        await transaction.commit();

        res.status(201).json(item);

    }

    catch (error) {

        await transaction.rollback();

        console.error(error);

        res.status(500).json({

            message:

                "Error creando el destinatario."

        });

    }

};

/*=========================================================
  ACTUALIZAR DESTINATARIO
=========================================================*/

export const actualizarDestinatario = async (req, res) => {

    const transaction =
        await NotificationRecipient.sequelize.transaction();

    try {

        const { id } = req.params;

        const item =
            await NotificationRecipient.findByPk(

                id,

                {

                    transaction

                }

            );

        if (!item) {

            await transaction.rollback();

            return res.status(404).json({

                message:

                    "Destinatario no encontrado."

            });

        }

        await item.update(

            req.body,

            {

                transaction

            }

        );

        await transaction.commit();

        res.json(item);

    }

    catch (error) {

        await transaction.rollback();

        console.error(error);

        res.status(500).json({

            message:

                "Error actualizando el destinatario."

        });

    }

};

/*=========================================================
  ELIMINAR DESTINATARIO
=========================================================*/

export const eliminarDestinatario = async (req, res) => {

    const transaction =
        await NotificationRecipient.sequelize.transaction();

    try {

        const { id } = req.params;

        const item =
            await NotificationRecipient.findByPk(

                id,

                {

                    transaction

                }

            );

        if (!item) {

            await transaction.rollback();

            return res.status(404).json({

                message:

                    "Destinatario no encontrado."

            });

        }

        await item.destroy({

            transaction

        });

        await transaction.commit();

        res.json({

            ok: true

        });

    }

    catch (error) {

        await transaction.rollback();

        console.error(error);

        res.status(500).json({

            message:

                "Error eliminando el destinatario."

        });

    }

};