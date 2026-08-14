import express from "express";

import {

    listarMetas,
    obtenerMeta,
    crearMeta,
    actualizarMeta,
    eliminarMeta,
    inicializarMetas

} from "../../controllers/evaluacion/metaController.js";

const router = express.Router();

/*=========================================================
  METAS
=========================================================*/

router.get(

    "/",

    listarMetas

);

router.get(

    "/:id",

    obtenerMeta

);

router.post(

    "/",

    crearMeta

);

router.put(

    "/:id",

    actualizarMeta

);

router.delete(

    "/:id",

    eliminarMeta

);

router.post(

    "/inicializar",

    inicializarMetas

);

export default router;