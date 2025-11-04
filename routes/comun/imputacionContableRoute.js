// routes/comun/imputacionContableRoute.js
import { Router } from "express";
import * as imputacionContableController from "../../controllers/comun/imputacionContableController.js";

const imputacionContableRouter = Router();

imputacionContableRouter.post("/imputaciones-contables", imputacionContableController.crearImputacionContable);
imputacionContableRouter.get("/imputaciones-contables", imputacionContableController.listarImputacionesContables);
imputacionContableRouter.get("/imputaciones-contables/:id", imputacionContableController.obtenerImputacionContablePorId);
imputacionContableRouter.put("/imputaciones-contables/:id", imputacionContableController.actualizarImputacionContable);
imputacionContableRouter.delete("/imputaciones-contables/:id", imputacionContableController.eliminarImputacionContable);

export default imputacionContableRouter;
