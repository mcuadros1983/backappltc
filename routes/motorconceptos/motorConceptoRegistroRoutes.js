import express from "express";

// import JWTAuth from "../../middleware/JWTAuth.js";

import {
  authorize,
} from "../../middleware/authorize.js";

import {
  getUploadCapacity,
  listByRegistro,
  listByTipo,
  remove as removeArchivo,
  uploadMultiple,
} from "../../controllers/motorConceptos/registroArchivoController.js";

import {
  registroArchivoUpload,
} from "../../middleware/registroArchivoUpload.js";

import {
  getResumenByEntidadTipo,
  getAll,
  getById,
  getHistory,
  create,
  createVersion,
  changeStatus,
  remove,
  markExpired,
  renovarRegistro,
  update
} from "../../controllers/motorconceptos/motorConceptoRegistroController.js";


const router =
  express.Router();

// router.use(
//   JWTAuth
// );

/*
 * Esta ruta debe ir antes de "/:id"
 * para evitar que Express interprete
 * "vencimientos" como un id.
 */

router.put(
  "/:id",
  // authorize(
  //     "motorconceptos:registros.update"
  // ),
  update
);

router.post(
  "/vencimientos/procesar",
  // authorize(
  //   "motorconceptos:vencimientos.view"
  // ),
  markExpired
);

// router.get(
//   "/",
//   authorize(
//     "motorconceptos:registros.view"
//   ),
//   getAll
// );


router.get(
  "/",
  // authorize("motorconceptos:registros.view"),
  // (req, res, next) => {
  //   console.log(">>> RUTA REGISTROS");
  //   next();
  // },
  getAll
);

router.get(
  "/resumen-entidades",
  //  authorize("motorconceptos:registros.view"), 
  getResumenByEntidadTipo
);

router.get(
  "/:id/historial",
  // authorize(
  //   "motorconceptos:registros.view"
  // ),
  getHistory
);

router.post(
  "/",

  registroArchivoUpload,

  create
);

// router.post(
//   "/",
//   create
// );

router.post(
  "/:id/versiones",
  // authorize(
  //   "motorconceptos:registros.update"
  // ),
  createVersion
);

router.put(
  "/:id/renovar",
  // authorize(
  //   "motorconceptos:registros.update"
  // ),
  renovarRegistro
);

router.put(
  "/:id/estado",
  // authorize(
  //   "motorconceptos:registros.update"
  // ),
  changeStatus
);

router.delete(
  "/:id",
  // authorize(
  //   "motorconceptos:registros.delete"
  // ),
  remove
);

router.get(
  "/:registroId/archivos",
  // authorize("motorconceptos:registros.view"),
  listByRegistro
);

router.get(
  "/:registroId/archivos/tipos/:archivoTipoId",
  // authorize("motorconceptos:registros.view"),
  listByTipo
);

router.get(
  "/:registroId/archivos/tipos/:archivoTipoId/capacidad",
  // authorize("motorconceptos:registros.view"),
  getUploadCapacity
);

router.post(
  "/:registroId/archivos",
  // authorize("motorconceptos:registros.update"),
  registroArchivoUpload,
  uploadMultiple
);

router.delete(
  "/archivos/:archivoId",
  // authorize("motorconceptos:registros.delete"),
  removeArchivo
);

router.get(
  "/:id",
  // authorize(
  //   "motorconceptos:registros.view"
  // ),
  getById
);
export default router;