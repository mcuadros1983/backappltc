import SchedulerRegistry from "./schedulerRegistry.js";

import SchedulerJob from "../../models/scheduler/schedulerJobModel.js";
import SchedulerExecution from "../../models/scheduler/schedulerExecutionModel.js";

/*=========================================================
  EJECUTAR JOB
=========================================================*/

const execute = async (

    codigo,

    contexto = {}

) => {

    const job =

        SchedulerRegistry.get(

            codigo

        );

    if (!job) {

        throw new Error(

            `El job "${codigo}" no está registrado.`

        );

    }

    if (

        typeof job.execute !== "function"

    ) {

        throw new Error(

            `El job "${codigo}" no implementa execute().`

        );

    }

    const schedulerJob =

        await SchedulerJob.findOne({

            where: {

                codigo

            }

        });

    if (!schedulerJob) {

        throw new Error(

            `No existe configuración para "${codigo}".`

        );

    }

    const inicio = new Date();

    const execution =

        await SchedulerExecution.create({

            job_id:

                schedulerJob.id,

            job_codigo:

                schedulerJob.codigo,

            inicio,

            estado:

                "EJECUTANDO"

        });

    try {

        const resultado =

            await job.execute(

                contexto

            );

        const fin = new Date();

        const duracion =

            fin.getTime() -

            inicio.getTime();

        await execution.update({

            fin,

            duracion,

            estado: "OK",

            mensaje:

                typeof resultado === "string"

                    ? resultado

                    : "Proceso ejecutado correctamente.",

            resultado:

                resultado

        });

        await schedulerJob.update({

            ultima_ejecucion: fin

        });

        return resultado;

    }

    catch (error) {

        const fin = new Date();

        const duracion =

            fin.getTime() -

            inicio.getTime();

        await execution.update({

            fin,

            duracion,

            estado: "ERROR",

            mensaje:

                error.message

        });

        throw error;

    }

};

export default {

    execute

};