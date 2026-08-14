import cron from "node-cron";

import SchedulerJob from "../../models/scheduler/schedulerJobModel.js";

import schedulerExecutor from "./schedulerExecutor.js";

/*=========================================================
  TAREAS REGISTRADAS
=========================================================*/

const tasks = new Map();

/*=========================================================
  INICIAR SCHEDULER
=========================================================*/

const start = async () => {

    await stop();

    const jobs =
        await SchedulerJob.findAll({

            where: {

                activo: true

            }

        });

    for (const job of jobs) {

        const task =
            cron.schedule(

                job.cron,

                async () => {

                    console.log(

                        `[Scheduler] Ejecutando ${job.codigo}`

                    );

                    await schedulerExecutor.execute(

                        job.codigo

                    );

                },

                {

                    scheduled: true

                }

            );

        tasks.set(

            job.codigo,

            task

        );

    }

    console.log(

        `[Scheduler] ${jobs.length} job(s) programados.`

    );

};

/*=========================================================
  DETENER
=========================================================*/

const stop = async () => {

    for (

        const task

        of tasks.values()

    ) {

        task.stop();

    }

    tasks.clear();

};

/*=========================================================
  RECARGAR
=========================================================*/

const reload = async () => {

    await stop();

    await start();

};

/*=========================================================
  EJECUTAR AHORA
=========================================================*/

const runNow = async (

    codigo,

    contexto = {}

) => {

    return await schedulerExecutor.execute(

        codigo,

        contexto

    );

};

export default {

    start,

    stop,

    reload,

    runNow

};