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

};


export default schedulerSeeder;