import { alertaTemplate } from "./base/alertaTemplate.js";

export const alertaCriticaTemplate = ({
    titulo,
    descripcion,
    datos = {},
    recomendaciones = []
}) => {

    return alertaTemplate({

        color: "#dc3545",

        icono: "🚨",

        titulo,

        descripcion,

        datos,

        recomendaciones

    });

};