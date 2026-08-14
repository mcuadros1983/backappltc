import express from "express";
import JWTAuth from "../../middleware/JWTAuth.js";
import { authorize } from "../../middleware/authorize.js";

import {
  getAll,
  getById,
  getHistory,
  create,
  createVersion,
  changeStatus,
  remove,
  markExpired,
} from "../../controllers/motorconceptos/motorConceptoRegistroController.js";

const router = express.Router();

router.use(JWTAuth);

router.get(
  "/",
  authorize("motorconceptos:registros.view"),
  getAll
);

router.get(
  "/:id",
  authorize("motorconceptos:registros.view"),
  getById
);

router.get(
  "/:id/historial",
  authorize("motorconceptos:registros.view"),
  getHistory
);

router.post(
  "/",
  authorize("motorconceptos:registros.create"),
  create
);

router.post(
  "/:id/versiones",
  authorize("motorconceptos:registros.update"),
  createVersion
);

router.put(
  "/:id/estado",
  authorize("motorconceptos:registros.update"),
  changeStatus
);

router.delete(
  "/:id",
  authorize("motorconceptos:registros.delete"),
  remove
);

router.post(
  "/vencimientos/procesar",
  authorize("motorconceptos:vencimientos.view"),
  markExpired
);

export default router;
