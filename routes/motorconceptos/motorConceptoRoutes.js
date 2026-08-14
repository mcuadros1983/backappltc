import express from "express";
// import JWTAuth from "../../middleware/JWTAuth.js";
import { authorize } from "../../middleware/authorize.js";

import {
//   seedEntidadTipos,
  getEntidadTipos,
  getAll,
  getById,
  create,
  update,
  remove,
  createField,
  updateField,
  removeField,
  createFileType,
  updateFileType,
  removeFileType,
  createRule,
  updateRule,
  removeRule,
  getCumplimiento,
  getVencimientos,
} from "../../controllers/motorconceptos/motorConceptoController.js";

const router = express.Router();
// router.use(JWTAuth);

router.get(
    "/cumplimiento",
    authorize("motorconceptos:view"),
    getCumplimiento
);

router.get(
    "/vencimientos",
    authorize("motorconceptos:view"),
    getVencimientos
);

// router.post(
//     "/entidad-tipos/seed",
//     authorize("motorconceptos:config"),
//     seedEntidadTipos
// );

router.get(
    "/entidad-tipos",
    authorize("motorconceptos:view"),
    getEntidadTipos
);

router.get(
    "/",
    authorize("motorconceptos:view"),
    getAll
);

router.get(
    "/:id",
    authorize("motorconceptos:view"),
    getById
);

router.post(
    "/",
    authorize("motorconceptos:create"),
    create
);

router.put(
    "/:id",
    authorize("motorconceptos:update"),
    update
);

router.delete(
    "/:id",
    authorize("motorconceptos:delete"),
    remove
);

router.post(
    "/:id/campos",
    authorize("motorconceptos:config"),
    createField
);

router.put(
    "/:id/campos/:fieldId",
    authorize("motorconceptos:config"),
    updateField
);

router.delete(
    "/:id/campos/:fieldId",
    authorize("motorconceptos:config"),
    removeField
);

router.post(
    "/:id/archivo-tipos",
    authorize("motorconceptos:config"),
    createFileType
);

router.put(
    "/:id/archivo-tipos/:fileTypeId",
    authorize("motorconceptos:config"),
    updateFileType
);

router.delete(
    "/:id/archivo-tipos/:fileTypeId",
    authorize("motorconceptos:config"),
    removeFileType
);

router.post(
    "/:id/reglas",
    authorize("motorconceptos:config"),
    createRule
);

router.put(
    "/:id/reglas/:ruleId",
    authorize("motorconceptos:config"),
    updateRule
);

router.delete(
    "/:id/reglas/:ruleId",
    authorize("motorconceptos:config"),
    removeRule
);

export default router;
