import express from "express";

import {
  listarProduccionLotes,
  obtenerProduccionLote,
  crearProduccionLote,
  actualizarProduccionLote,
  eliminarProduccionLote,
  obtenerArticulosProduccion
} from "../../controllers/fabrica/produccionLoteController.js";

const router = express.Router();

router.get("/", listarProduccionLotes);

router.get("/articulos", obtenerArticulosProduccion);

router.get("/:id", obtenerProduccionLote);

router.post("/", crearProduccionLote);

router.put("/:id", actualizarProduccionLote);

router.delete("/:id", eliminarProduccionLote);

export default router;