// routes/comun/tipoTarjetaRoute.js
import { Router } from "express";
import * as tipoTarjetaController from "../../controllers/comun/tipoTarjetaController.js";

const tipoTarjetaRouter = Router();

tipoTarjetaRouter.post("/tipos-tarjeta", tipoTarjetaController.crearTipoTarjeta);
tipoTarjetaRouter.get("/tipos-tarjeta", tipoTarjetaController.listarTiposTarjeta);
tipoTarjetaRouter.get("/tipos-tarjeta/:id", tipoTarjetaController.obtenerTipoTarjetaPorId);
tipoTarjetaRouter.put("/tipos-tarjeta/:id", tipoTarjetaController.actualizarTipoTarjeta);
tipoTarjetaRouter.delete("/tipos-tarjeta/:id", tipoTarjetaController.eliminarTipoTarjeta);

export default tipoTarjetaRouter;
