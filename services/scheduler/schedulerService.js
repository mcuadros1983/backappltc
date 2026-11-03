import cron from "node-cron";

import SchedulerJob from "../../models/scheduler/schedulerJobModel.js";

import schedulerExecutor from "./schedulerExecutor.js";

import schedulerRegistry from "./schedulerRegistry.js";
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

    console.log("========== DIAGNÓSTICO SCHEDULER ==========");

    console.log(
        "[Scheduler] Fecha actual:",
        new Date().toISOString()
    );

    console.log(
        "[Scheduler] PID:",
        process.pid
    );

    console.log(
        "[Scheduler] Jobs activos en PostgreSQL:",
        jobs.length
    );

    for (const job of jobs) {
        const handler = schedulerRegistry.get(job.codigo);

        console.log("[Scheduler] Configuración:", {
            codigo: job.codigo,
            cron: job.cron,
            activo: job.activo,
            registrado: !!handler,
            tipoHandler: typeof handler,
            tieneExecute: typeof handler?.execute === "function",
        });
    }

    console.log("===========================================");

    for (const job of jobs) {

        const task =
            cron.schedule(

                job.cron,

                async () => {
                    const inicio = new Date();

                    console.log(
                        `[Scheduler] DISPARADO | ${job.codigo} | ${inicio.toISOString()}`
                    );

                    try {
                        const resultado = await schedulerExecutor.execute(
                            job.codigo
                        );

                        console.log(
                            `[Scheduler] FINALIZADO OK | ${job.codigo}`,
                            resultado
                        );

                    } catch (error) {
                        console.error(
                            `[Scheduler] ERROR | ${job.codigo}`,
                            error
                        );
                    }
                },

                {

                    scheduled:
                        true,

                    timezone:
                        "America/Argentina/Buenos_Aires"

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