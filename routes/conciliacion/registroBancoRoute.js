// routes/conciliacion/registroBancoRoute.js
import { Router } from "express";
import * as registroBancoController from "../../controllers/conciliacion/registroBancoController.js";

const registroBancoRouter = Router();

registroBancoRouter.post("/conciliacion-registros-banco", registroBancoController.crearRegistroBanco);
registroBancoRouter.get("/conciliacion-registros-banco", registroBancoController.listarRegistrosBanco);
registroBancoRouter.get("/conciliacion-registros-banco/:id", registroBancoController.obtenerRegistroBancoPorId);
registroBancoRouter.put("/conciliacion-registros-banco/:id", registroBancoController.actualizarRegistroBanco);
registroBancoRouter.delete("/conciliacion-registros-banco/:id", registroBancoController.eliminarRegistroBanco);

export default registroBancoRouter;
    