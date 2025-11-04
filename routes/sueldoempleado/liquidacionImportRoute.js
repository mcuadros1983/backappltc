import { Router } from "express";
import multer from "multer";
import {
  importarRecibosExcel,
  descargarTemplateRecibosExcel
} from "../../controllers/sueldoempleado/liquidacionImportController.js";

const upload = multer({ storage: multer.memoryStorage() });
const liquidacionImportRouter = Router();

liquidacionImportRouter.post(
  "/liquidacion/recibos/import",
  upload.single("file"),
  importarRecibosExcel
);

liquidacionImportRouter.get(
  "/liquidacion/recibos/template",
  descargarTemplateRecibosExcel
);

export default liquidacionImportRouter;
