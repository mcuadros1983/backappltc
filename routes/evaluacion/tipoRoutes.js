import express from "express";

import {
  listarTiposEvaluacion,
  obtenerTipoEvaluacion,
  crearTipoEvaluacion,
  actualizarTipoEvaluacion,
  eliminarTipoEvaluacion,
} from "../../controllers/evaluacion/tipoController.js";

const router = express.Router();

router.get("/", listarTiposEvaluacion);

router.get("/:id", obtenerTipoEvaluacion);

router.post("/", crearTipoEvaluacion);

router.put("/:id", actualizarTipoEvaluacion);

router.delete("/:id", eliminarTipoEvaluacion);

export default router;