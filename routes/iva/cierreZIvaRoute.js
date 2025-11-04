import { Router } from "express";
import * as cierreZIvaController from "../../controllers/iva/cierreZIvaController.js";

const cierreZIvaRouter = Router();

cierreZIvaRouter.post("/cierres-z-iva", cierreZIvaController.crearCierreZIva);
cierreZIvaRouter.get("/cierres-z-iva", cierreZIvaController.listarCierresZIva);
cierreZIvaRouter.get("/cierres-z-iva/:id", cierreZIvaController.obtenerCierreZIvaPorId);
cierreZIvaRouter.put("/cierres-z-iva/:id", cierreZIvaController.actualizarCierreZIva);
cierreZIvaRouter.delete("/cierres-z-iva/:id", cierreZIvaController.eliminarCierreZIva);

export default cierreZIvaRouter;
