import evaluacionSchedulerService
    from "../../evaluacion/evaluacionSchedulerService.js";

/*=========================================================
  EJECUTAR
=========================================================*/

const execute = async () => {

    return await

        evaluacionSchedulerService

            .procesarAutoevaluaciones();

};

export default {

    execute

};