import NotificationTemplate from "../../models/notification/notificationTemplateModel.js";

/*=========================================================
  LISTAR PLANTILLAS
=========================================================*/

export const listarPlantillas = async (req, res) => {

    try {

        const items =
            await NotificationTemplate.findAll({

                order: [

                    ["nombre", "ASC"]

                ]

            });

        res.json(items);

    }

    catch (error) {

        console.error(error);

        res.status(500).json({

            message:

                "Error obteniendo las plantillas."

        });

    }

};

/*=========================================================
  OBTENER PLANTILLA
=========================================================*/

export const obtenerPlantilla = async (req, res) => {

    try {

        const { id } = req.params;

        const item =
            await NotificationTemplate.findByPk(id);

        if (!item) {

            return res.status(404).json({

                message:

                    "Plantilla no encontrada."

            });

        }

        res.json(item);

    }

    catch (error) {

        console.error(error);

        res.status(500).json({

            message:

                "Error obteniendo la plantilla."

        });

    }

};

/*=========================================================
  CREAR PLANTILLA
=========================================================*/

export const crearPlantilla = async (req, res) => {

    const transaction =
        await NotificationTemplate.sequelize.transaction();

    try {

        const existe =
            await NotificationTemplate.findOne({

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

                    "Ya existe una plantilla con ese código."

            });

        }

        const item =
            await NotificationTemplate.create(

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

                "Error creando la plantilla."

        });

    }

};

/*=========================================================
  ACTUALIZAR PLANTILLA
=========================================================*/

export const actualizarPlantilla = async (req, res) => {

    const transaction =
        await NotificationTemplate.sequelize.transaction();

    try {

        const { id } = req.params;

        const item =
            await NotificationTemplate.findByPk(

                id,

                {

                    transaction

                }

            );

        if (!item) {

            await transaction.rollback();

            return res.status(404).json({

                message:

                    "Plantilla no encontrada."

            });

        }

        const existe =
            await NotificationTemplate.findOne({

                where: {

                    codigo:

                        req.body.codigo

                },

                transaction

            });

        if (

            existe &&

            existe.id !== item.id

        ) {

            await transaction.rollback();

            return res.status(400).json({

                message:

                    "Ya existe una plantilla con ese código."

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

                "Error actualizando la plantilla."

        });

    }

};

/*=========================================================
  ELIMINAR PLANTILLA
=========================================================*/

export const eliminarPlantilla = async (req, res) => {

    const transaction =
        await NotificationTemplate.sequelize.transaction();

    try {

        const { id } = req.params;

        const item =
            await NotificationTemplate.findByPk(

                id,

                {

                    transaction

                }

            );

        if (!item) {

            await transaction.rollback();

            return res.status(404).json({

                message:

                    "Plantilla no encontrada."

            });

        }

        await item.destroy({

            transaction

        });

        await transaction.commit();

        res.json({

            ok: true,

            message:

                "Plantilla eliminada correctamente."

        });

    }

    catch (error) {

        await transaction.rollback();

        console.error(error);

        res.status(500).json({

            message:

                "Error eliminando la plantilla."

        });

    }

};