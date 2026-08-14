import {
  Router,
} from "express";

import {
  authorize,
} from "../../middleware/authorize.js";

import {
  download,
  history,
  listByRegistro,
  remove,
  replace,
  uploadMultiple,
} from "../../controllers/motorConceptos/motorConceptoRegistroArchivoController.js";

import {
  uploadMultiple as uploadMultipleMiddleware,
  uploadReplacement,
} from "../../middleware/motorConceptoRegistroArchivoUpload.js";

const router =
  Router();

router.get(
  "/registros/:registroId/archivos",
  authorize(
    "motorconceptos:registros.view"
  ),
  listByRegistro
);

router.post(
  "/registros/:registroId/archivos",
  authorize(
    "motorconceptos:registros.update"
  ),
  uploadMultipleMiddleware,
  uploadMultiple
);

router.get(
  "/archivos/:archivoId/download",
  authorize(
    "motorconceptos:registros.view"
  ),
  download
);

router.get(
  "/archivos/:archivoId/historial",
  authorize(
    "motorconceptos:registros.view"
  ),
  history
);

router.put(
  "/archivos/:archivoId/reemplazar",
  authorize(
    "motorconceptos:registros.update"
  ),
  uploadReplacement,
  replace
);

router.delete(
  "/archivos/:archivoId",
  authorize(
    "motorconceptos:registros.delete"
  ),
  remove
);

export default router;
