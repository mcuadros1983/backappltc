const MS_PER_DAY =
    1000 * 60 * 60 * 24;

const startOfDay = (
    value = new Date()
) => {

    const date =
        new Date(value);

    date.setHours(
        0,
        0,
        0,
        0
    );

    return date;

};

const calcularDiasRestantes = (
    fechaVencimiento
) => {

    if (!fechaVencimiento) {
        return null;
    }

    const hoy =
        startOfDay();

    const fecha =
        startOfDay(
            fechaVencimiento
        );

    return Math.floor(
        (
            fecha - hoy
        ) / MS_PER_DAY
    );

};

const calcularEstadoRegistro = ({
    usaVencimiento,
    fechaVencimiento,
}) => {

    /*
     * Conceptos sin vencimiento
     */

    if (!usaVencimiento) {

        return "BORRADOR";

    }

    /*
     * Usa vencimiento
     * pero todavía no tiene fecha.
     */

    if (!fechaVencimiento) {

        return "BORRADOR";

    }

    const dias =
        calcularDiasRestantes(
            fechaVencimiento
        );

    if (dias < 0) {

        return "VENCIDO";

    }

    return "VIGENTE";

};

const calcularEstadoVisual = ({
    fechaVencimiento,
    diasAlerta = 0,
}) => {

    if (!fechaVencimiento) {

        return "SIN_VENCIMIENTO";

    }

    const dias =
        calcularDiasRestantes(
            fechaVencimiento
        );

    if (dias < 0) {

        return "VENCIDO";

    }

    if (
        dias <= diasAlerta
    ) {

        return "POR_VENCER";

    }

    return "VIGENTE";

};

export default {

    calcularEstadoRegistro,

    calcularEstadoVisual,

    calcularDiasRestantes,

};