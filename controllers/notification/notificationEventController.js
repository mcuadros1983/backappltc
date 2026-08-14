import NotificationEvent from "../../models/notification/notificationEventModel.js";

/*=========================================================
  LISTAR EVENTOS
=========================================================*/

export const listarEventos = async (req, res) => {

    try {

        const items =
            await NotificationEvent.findAll({

                order: [

                    ["categoria", "ASC"],

                    ["nombre", "ASC"]

                ]

            });

        res.json(items);

    }

    catch (error) {

        console.error(error);

        res.status(500).json({

            message:
                "Error obteniendo los eventos."

        });

    }

};

/*=========================================================
  OBTENER EVENTO
=========================================================*/

export const obtenerEvento = async (req, res) => {

    try {

        const { id } = req.params;

        const item =
            await NotificationEvent.findByPk(id);

        if (!item) {

            return res.status(404).json({

                message:
                    "Evento no encontrado."

            });

        }

        res.json(item);

    }

    catch (error) {

        console.error(error);

        res.status(500).json({

            message:
                "Error obteniendo el evento."

        });

    }

};

/*=========================================================
  CREAR EVENTO
=========================================================*/

export const crearEvento = async (req, res) => {

    const transaction =
        await NotificationEvent.sequelize.transaction();

    try {

        const existe =
            await NotificationEvent.findOne({

                where: {

                    codigo:

                        req.body.codigo

                },

                transaction

            });

        if (existe) {

            await transaction.rollback();

            return res.status(400).json({

                message:
                    "Ya existe un evento con ese código."

            });

        }

        const item =
            await NotificationEvent.create(

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
                "Error creando el evento."

        });

    }

};

/*=========================================================
  ACTUALIZAR EVENTO
=========================================================*/

export const actualizarEvento = async (req, res) => {

    const transaction =
        await NotificationEvent.sequelize.transaction();

    try {

        const { id } = req.params;

        const item =
            await NotificationEvent.findByPk(

                id,

                {

                    transaction

                }

            );

        if (!item) {

            await transaction.rollback();

            return res.status(404).json({

                message:
                    "Evento no encontrado."

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
                "Error actualizando el evento."

        });

    }

};

/*=========================================================
  ELIMINAR EVENTO
=========================================================*/

export const eliminarEvento = async (req, res) => {

    const transaction =
        await NotificationEvent.sequelize.transaction();

    try {

        const { id } = req.params;

        const item =
            await NotificationEvent.findByPk(

                id,

                {

                    transaction

                }

            );

        if (!item) {

            await transaction.rollback();

            return res.status(404).json({

                message:
                    "Evento no encontrado."

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
                "Error eliminando el evento."

        });

    }

};