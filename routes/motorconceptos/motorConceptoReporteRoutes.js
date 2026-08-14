import express from "express";
// import JWTAuth from "../../middleware/JWTAuth.js";
import { authorize } from "../../middleware/authorize.js";

import {
  getRegistros,
} from "../../controllers/motorconceptos/motorConceptoReporteController.js";

const router = express.Router();

// router.use(JWTAuth);

router.get(
  "/registros",
  authorize("motorconceptos:view"),
  getRegistros
);

export default router;