// routes/comun/empresaRoute.js
import { Router } from "express";
import * as empresaController from "../../controllers/comun/empresaController.js";

const empresaRouter = Router();

empresaRouter.post("/empresas", empresaController.crearEmpresa);
empresaRouter.get("/empresas", empresaController.listarEmpresas);
empresaRouter.get("/empresas/:id", empresaController.obtenerEmpresaPorId);
empresaRouter.put("/empresas/:id", empresaController.actualizarEmpresa);
empresaRouter.delete("/empresas/:id", empresaController.eliminarEmpresa);

export default empresaRouter;
