import EvaluacionMeta from "../../models/evaluacion/evaluacionMetaModel.js";

import EvaluacionMetaAsignacion from "../../models/evaluacion/evaluacionMetaAsignacionModel.js";



/*=========================================================
CALCULAR PORCENTAJE
=========================================================*/

export const calcularPorcentaje = (

    valorActual,

    valorObjetivo

) => {

    const actual = Number(

        valorActual || 0

    );

    const objetivo = Number(

        valorObjetivo || 0

    );

    if (objetivo <= 0) {

        return 0;

    }

    let porcentaje =

        (actual / objetivo) * 100;

    if (porcentaje > 100) {

        porcentaje = 100;

    }

    if (porcentaje < 0) {

        porcentaje = 0;

    }

    return Number(

        porcentaje.toFixed(2)

    );

};



/*=========================================================
OBTENER ESTADO
=========================================================*/

export const obtenerEstadoMeta = (

    porcentaje

) => {

    if (porcentaje >= 100) {

        return "CUMPLIDA";

    }

    if (porcentaje > 0) {

        return "EN_PROCESO";

    }

    return "ASIGNADA";

};



/*=========================================================
RECALCULAR CUMPLIMIENTO
=========================================================*/

export const recalcularCumplimiento = async (

    asignacionId

) => {

    const asignacion =

        await EvaluacionMetaAsignacion.findByPk(

            asignacionId,

            {

                include: [

                    {

                        model: EvaluacionMeta,

                        as: "meta"

                    }

                ]

            }

        );

    if (!asignacion) {

        throw new Error(

            "Asignación no encontrada."

        );

    }

    const porcentaje =

        calcularPorcentaje(

            asignacion.valor_actual,

            asignacion.meta.valor_objetivo

        );

    const estado =

        obtenerEstadoMeta(

            porcentaje

        );

    await asignacion.update({

        porcentaje_cumplimiento:

            porcentaje,

        estado

    });

    return asignacion;

};



/*=========================================================
ACTUALIZAR VALOR ACTUAL
=========================================================*/

export const actualizarValorActual = async (

    asignacionId,

    nuevoValor

) => {

    const asignacion =

        await EvaluacionMetaAsignacion.findByPk(

            asignacionId

        );

    if (!asignacion) {

        throw new Error(

            "Asignación no encontrada."

        );

    }

    await asignacion.update({

        valor_actual:

            nuevoValor

    });

    return asignacion;

};

export const inicializarMetasDefault = async () => {

const configuracion = [

    {
        codigo: "FREC_AUTO",
        nombre: "Frecuencia Autoevaluación",
        categoria: "FRECUENCIA",
        tipo: "AUTO",
        capa: "AUTO",
        unidad_medida: "DIAS",
        frecuencia_unidad: "DIAS",
        valor_objetivo: 30
    },

    {
        codigo: "FREC_SUP",
        nombre: "Frecuencia Supervisor",
        categoria: "FRECUENCIA",
        tipo: "SUPERVISOR",
        capa: "SUPERVISOR",
        unidad_medida: "DIAS",
        frecuencia_unidad: "DIAS",
        valor_objetivo: 30
    },

    {
        codigo: "FREC_MYS",
        nombre: "Frecuencia Mystery",
        categoria: "FRECUENCIA",
        tipo: "MYSTERY",
        capa: "MYSTERY",
        unidad_medida: "DIAS",
        frecuencia_unidad: "DIAS",
        valor_objetivo: 90
    },

    {
        codigo: "CUMP_AUTO",
        nombre: "Cumplimiento Auto",
        categoria: "CUMPLIMIENTO",
        tipo: "AUTO",
        capa: "AUTO",
        unidad_medida: "PORCENTAJE",
        valor_objetivo: 70
    },

    {
        codigo: "CUMP_SUP",
        nombre: "Cumplimiento Supervisor",
        categoria: "CUMPLIMIENTO",
        tipo: "SUPERVISOR",
        capa: "SUPERVISOR",
        unidad_medida: "PORCENTAJE",
        valor_objetivo: 85
    },

    {
        codigo: "CUMP_MYS",
        nombre: "Cumplimiento Mystery",
        categoria: "CUMPLIMIENTO",
        tipo: "MYSTERY",
        capa: "MYSTERY",
        unidad_medida: "PORCENTAJE",
        valor_objetivo: 90
    },

    {
        codigo: "BRE_AUTO_SUP",
        nombre: "Brecha Auto vs Supervisor",
        categoria: "BRECHA",
        tipo: "GENERAL",
        comparacion: "AUTO ↔ SUPERVISOR",
        unidad_medida: "PUNTOS",
        valor_objetivo: 10
    },

    {
        codigo: "BRE_AUTO_MYS",
        nombre: "Brecha Auto vs Mystery",
        categoria: "BRECHA",
        tipo: "GENERAL",
        comparacion: "AUTO ↔ MYSTERY",
        unidad_medida: "PUNTOS",
        valor_objetivo: 10
    },

    {
        codigo: "BRE_SUP_MYS",
        nombre: "Brecha Supervisor vs Mystery",
        categoria: "BRECHA",
        tipo: "GENERAL",
        comparacion: "SUPERVISOR ↔ MYSTERY",
        unidad_medida: "PUNTOS",
        valor_objetivo: 10
    }

];

    for (const item of configuracion) {

        const existe =

            await EvaluacionMeta.findOne({

                where: {

                    codigo:

                        item.codigo

                }

            });

        if (existe) {

            continue;

        }

        await EvaluacionMeta.create({

            ...item,

            prioridad: "MEDIA",

            ponderacion: 100,

            estado: "ACTIVA"

        });

    }

    return {

        ok: true

    };

}