import { Router } from "express";

import {
  crearSnapshot,
  listar,
  obtener,
  eliminar,
} from "../../controllers/inteligencia/inteligenciaSnapshotController.js";


const router = Router();


router.get(
  "/snapshots",
  listar
);


router.get(
  "/snapshots/:id",
  obtener
);


router.post(
  "/snapshots",
  crearSnapshot
);


router.delete(
  "/snapshots/:id",
  eliminar
);


export default router;