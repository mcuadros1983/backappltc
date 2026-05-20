import { Router } from "express";
import {
  crearPromocion,
  listarPromociones,
  obtenerPromocion,
  actualizarPromocion,
  eliminarPromocion,
  getPrecioArticulo,
  getPreciosMasivo,
} from "../../controllers/tablas/promocionController.js";

const router = Router();

// CRUD
router.post("/", crearPromocion);
router.get("/", listarPromociones);
router.get("/:id", obtenerPromocion);
router.put("/:id", actualizarPromocion);
router.delete("/:id", eliminarPromocion);

// Funcionales
router.get("/precio/:articulo_id", getPrecioArticulo);
router.post("/precios", getPreciosMasivo);

export default router;