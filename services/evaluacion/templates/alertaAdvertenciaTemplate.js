import { alertaTemplate } from "./base/alertaTemplate.js";

export const alertaAdvertenciaTemplate = ({
    titulo,
    descripcion,
    datos = {},
    recomendaciones = []
}) => {

    return alertaTemplate({

        color: "#ffc107",

        icono: "⚠️",

        titulo,

        descripcion,

        datos,

        recomendaciones

    });

};