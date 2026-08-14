import SchedulerJob from "../../models/scheduler/schedulerJobModel.js";

import schedulerRegistry from "./schedulerRegistry.js";
import inteligenciaClimaDiarioJob
    from "./jobs/inteligenciaClimaDiarioJob.js";
/*=========================================================
  IMPORTAR JOBS
=========================================================*/

import autoevaluacionJob from "./jobs/autoevaluacionJob.js";

import motorConceptoVencimientosJob
    from "./jobs/motorConceptoVencimientosJob.js";


import inteligenciaSnapshotDiarioJob
    from "./jobs/inteligenciaSnapshotDiarioJob.js";
/*=========================================================
  MAPA DE JOBS
=========================================================*/

const handlers = {

    autoevaluacionJob,

    motorConceptoVencimientosJob,

    inteligenciaClimaDiarioJob,

    inteligenciaSnapshotDiarioJob

};

/*=========================================================
  CARGAR JOBS
=========================================================*/

const load = async () => {

    const jobs =
        await SchedulerJob.findAll({

            where: {

                activo: true

            }

        });

    for (const item of jobs) {

        const handler =

            handlers[item.handler];

        if (!handler) {

            console.warn(

                `Scheduler: Handler "${item.handler}" no encontrado.`

            );

            continue;

        }

        schedulerRegistry.register(

            item.codigo,

            handler

        );

    }

    console.log(

        `Scheduler: ${jobs.length} job(s) registrados.`

    );

};

export default {

    load

};