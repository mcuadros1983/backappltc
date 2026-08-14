import NotificationEvent from "../../models/notification/notificationEventModel.js";

/*=========================================================
  OBTENER EVENTO
=========================================================*/

const get = async (

    codigo

) => {

    return await NotificationEvent.findOne({

        where: {

            codigo,

            activo: true

        }

    });

};

/*=========================================================
  VALIDAR EVENTO
=========================================================*/

const validate = async (

    codigo

) => {

    const evento =

        await get(

            codigo

        );

    if (!evento) {

        throw new Error(

            `El evento "${codigo}" no existe.`

        );

    }

    return evento;

};

export default {

    get,

    validate

};