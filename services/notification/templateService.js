import NotificationTemplate from "../../models/notification/notificationTemplateModel.js";

/*=========================================================
  REEMPLAZAR VARIABLES
=========================================================*/

const reemplazarVariables = (

    contenido,

    datos = {}

) => {

    if (!contenido) {

        return "";

    }

    let resultado = contenido;

    Object.entries(datos).forEach(

        ([clave, valor]) => {

            const regex =
                new RegExp(

                    `{{\\s*${clave}\\s*}}`,

                    "g"

                );

            resultado =
                resultado.replace(

                    regex,

                    valor ?? ""

                );

        }

    );

    return resultado;

};

/*=========================================================
  OBTENER PLANTILLA
=========================================================*/

const obtenerPlantilla = async (

    codigo

) => {

    const plantilla =
        await NotificationTemplate.findOne({

            where: {

                codigo,

                activo: true

            }

        });

    if (!plantilla) {

        throw new Error(

            `No existe la plantilla "${codigo}".`

        );

    }

    return plantilla;

};

/*=========================================================
  RENDERIZAR PLANTILLA
=========================================================*/

const render = async (

    codigo,

    datos = {}

) => {

    const plantilla =
        await obtenerPlantilla(

            codigo

        );

    return {

        subject:

            reemplazarVariables(

                plantilla.asunto,

                datos

            ),

        html:

            reemplazarVariables(

                plantilla.html,

                datos

            ),

        text:

            reemplazarVariables(

                plantilla.texto,

                datos

            )

    };

};

export default {

    obtenerPlantilla,

    render

};