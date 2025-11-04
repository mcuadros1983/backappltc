// routes/comun/bancoRoute.js
import { Router } from "express";
import * as bancoController from "../../controllers/comun/bancoController.js";

const bancoRouter = Router();

bancoRouter.post("/bancos", bancoController.crearBanco);
bancoRouter.get("/bancos", bancoController.listarBancos);
bancoRouter.get("/bancos/:id", bancoController.obtenerBancoPorId);
bancoRouter.put("/bancos/:id", bancoController.actualizarBanco);
bancoRouter.delete("/bancos/:id", bancoController.eliminarBanco);

export default bancoRouter;
