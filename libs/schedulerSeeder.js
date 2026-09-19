import SchedulerJob
    from "../models/scheduler/schedulerJobModel.js";


const schedulerSeeder = async () => {


    /*
    |--------------------------------------------------------------------------
    | MOTOR CONCEPTOS
    |--------------------------------------------------------------------------
    */

    await SchedulerJob.findOrCreate({

        where: {
            codigo:
                "motorconceptos.vencimientos",
        },

        defaults: {

            nombre:
                "Procesar vencimientos Motor Conceptos",

            descripcion:
                "Marca automáticamente como vencidos los registros cuya fecha ya expiró.",

            modulo:
                "Motor Conceptos",

            handler:
                "motorConceptoVencimientosJob",

            cron:
                "0 0 * * *",

            activo: true,

            orden: 1,

        },

    });


    /*
    |--------------------------------------------------------------------------
    | INTELIGENCIA COMERCIAL - CLIMA
    |--------------------------------------------------------------------------
    */

    await SchedulerJob.findOrCreate({

        where: {
            codigo:
                "inteligencia.clima.diario",
        },

        defaults: {

            nombre:
                "Actualizar clima Inteligencia Comercial",

            descripcion:
                "Registra automáticamente el clima histórico del día anterior para Inteligencia Comercial.",

            modulo:
                "Inteligencia Comercial",

            handler:
                "inteligenciaClimaDiarioJob",

            cron:
                "0 6 * * *",

            activo: true,

            orden: 1,

        },

    });

    await SchedulerJob.findOrCreate({

        where: {
            codigo:
                "inteligencia.snapshot.diario",
        },

        defaults: {

            nombre:
                "Snapshot diario Inteligencia Comercial",

            descripcion:
                "Captura automáticamente los precios y promociones configurados para Inteligencia Comercial.",

            modulo:
                "Inteligencia Comercial",

            handler:
                "inteligenciaSnapshotDiarioJob",

            cron:
                "30 5 * * *",

            activo: true,

            orden: 2,

        },

    });

    /*
|--------------------------------------------------------------------------
| TESORERÍA - LIBRO IVA
|--------------------------------------------------------------------------
*/

    await SchedulerJob.findOrCreate({

        where: {
            codigo:
                "tesoreria.libroiva.mensual",
        },

        defaults: {

            nombre:
                "Crear Libros IVA mensuales",

            descripcion:
                "Verifica y crea automáticamente el Libro IVA del período actual para cada empresa.",

            modulo:
                "Tesorería",

            handler:
                "libroIVAMensualJob",

            /*
             * Ejecutar todos los días
             * a las 05:15.
             *
             * El job es idempotente:
             * si el Libro IVA ya existe,
             * no vuelve a crearlo.
             */
            cron:
                "15 5 * * *",

            activo:
                true,

            orden:
                3,

        },

    });

    /*
|--------------------------------------------------------------------------
| SUELDOS - PERÍODO LIQUIDACIÓN
|--------------------------------------------------------------------------
*/

    await SchedulerJob.findOrCreate({

        where: {
            codigo:
                "sueldos.periodoliquidacion.mensual",
        },

        defaults: {

            nombre:
                "Crear período de liquidación mensual",

            descripcion:
                "Verifica y crea automáticamente el período de liquidación correspondiente al mes actual.",

            modulo:
                "Sueldos",

            handler:
                "periodoLiquidacionMensualJob",

            /*
             * Ejecutar todos los días
             * a las 05:20.
             *
             * El job es idempotente:
             * si el período ya existe,
             * no vuelve a crearlo.
             */
            cron:
                "20 5 * * *",

            activo:
                true,

            orden:
                1,

        },

    });

};


export default schedulerSeeder;