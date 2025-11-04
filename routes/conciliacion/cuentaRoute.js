// routes/conciliacion/cuentaRoute.js
import { Router } from "express";
import * as cuentaController from "../../controllers/conciliacion/cuentaController.js";

const cuentaRouter = Router();

cuentaRouter.post("/conciliacion-cuentas", cuentaController.crearCuenta);
cuentaRouter.get("/conciliacion-cuentas", cuentaController.listarCuentas);
cuentaRouter.get("/conciliacion-cuentas/:id", cuentaController.obtenerCuentaPorId);
cuentaRouter.put("/conciliacion-cuentas/:id", cuentaController.actualizarCuenta);
cuentaRouter.delete("/conciliacion-cuentas/:id", cuentaController.eliminarCuenta);

export default cuentaRouter;
