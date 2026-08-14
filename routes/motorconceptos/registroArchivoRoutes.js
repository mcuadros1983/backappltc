import { Router } from "express";

import { authorize } from "../../middleware/authorize.js";

import {
    getUploadCapacity,
    listByRegistro,
    listByTipo,
    remove,
    uploadMultiple,
} from "../../controllers/motorconceptos/registroArchivoController.js";

import {
    registroArchivoUpload,
} from "../../middleware/registroArchivoUpload.js";

const router = Router();

router.get(
    "/registros/:registroId/archivos",
    authorize("motorconceptos:registros.view"),
    listByRegistro
);

router.get(
    "/registros/:registroId/archivos/tipos/:archivoTipoId",
    authorize("motorconceptos:registros.view"),
    listByTipo
);

router.get(
    "/registros/:registroId/archivos/tipos/:archivoTipoId/capacidad",
    authorize("motorconceptos:registros.view"),
    getUploadCapacity
);

router.post(
    "/registros/:registroId/archivos",
    authorize("motorconceptos:registros.update"),
    registroArchivoUpload,
    uploadMultiple
);

router.delete(
    "/archivos/:archivoId",
    authorize("motorconceptos:registros.delete"),
    remove
);

export default router;
