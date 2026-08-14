import { alertaTemplate } from "./base/alertaTemplate.js";

export const alertaInformativaTemplate = ({
    titulo,
    descripcion,
    datos = {},
    recomendaciones = []
}) => {

    return alertaTemplate({

        color: "#0d6efd",

        icono: "ℹ️",

        titulo,

        descripcion,

        datos,

        recomendaciones

    });

};