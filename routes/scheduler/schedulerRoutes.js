import express from "express";

import {

    listarJobs,
    obtenerJob,
    crearJob,
    actualizarJob,
    eliminarJob,
    ejecutarAhora

} from "../../controllers/scheduler/schedulerJobController.js";

import { authorize } from "../../middleware/authorize.js";

const router = express.Router();

/*=========================================================
  JOBS
=========================================================*/

router.get(

    "/jobs",

    authorize("scheduler.view"),

    listarJobs

);

router.get(

    "/jobs/:id",

    authorize("scheduler.view"),

    obtenerJob

);

router.post(

    "/jobs",

    authorize("scheduler.create"),

    crearJob

);

router.put(

    "/jobs/:id",

    authorize("scheduler.update"),

    actualizarJob

);

router.delete(

    "/jobs/:id",

    authorize("scheduler.delete"),

    eliminarJob

);

router.post(

    "/jobs/:id/run",

    authorize("scheduler.execute"),

    ejecutarAhora

);

export default router;