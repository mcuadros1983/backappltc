import { Router } from "express";
import multer from "multer";
import * as controller from "../../controllers/sueldoempleado/adicionalVariableImportController.js";

const upload = multer({ storage: multer.memoryStorage() });
const adicionalVariableImportRouter = Router();

adicionalVariableImportRouter.post(
  "/adicionalvariableimportitems/import",
  upload.single("file"),
  controller.importarAdicionalVariable
);

// opcional: template
adicionalVariableImportRouter.get( 
  "/adicionalvariableimportitems/template",
  controller.descargarTemplateAdicionalVariable
);

export default adicionalVariableImportRouter;
