import { Router } from "express";
import * as controller from "../../controllers/asistencia/conceptoController.js";

const conceptoRouter = Router();

//conseptoRouter?.use?.(); // (evita tree-shaking raro en algunos bundlers) — ignora esta línea si no te gusta

const router = Router();
router.post("/conceptos", controller.crearConcepto);
router.get("/conceptos", controller.listarConceptos);
router.get("/conceptos/:id", controller.obtenerConceptoPorId);
router.put("/conceptos/:id", controller.actualizarConcepto);
router.delete("/conceptos/:id", controller.eliminarConcepto);

export default router;
