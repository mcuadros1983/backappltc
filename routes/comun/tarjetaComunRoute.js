// routes/comun/tarjetaComunRoute.js
import { Router } from "express";
import * as tarjetaComunController from "../../controllers/comun/tarjetaComunController.js";

const tarjetaComunRouter = Router();

tarjetaComunRouter.post("/tarjetas-comunes", tarjetaComunController.crearTarjetaComun);
tarjetaComunRouter.get("/tarjetas-comunes", tarjetaComunController.listarTarjetasComunes);
tarjetaComunRouter.get("/tarjetas-comunes/:id", tarjetaComunController.obtenerTarjetaComunPorId);
tarjetaComunRouter.put("/tarjetas-comunes/:id", tarjetaComunController.actualizarTarjetaComun);
tarjetaComunRouter.delete("/tarjetas-comunes/:id", tarjetaComunController.eliminarTarjetaComun);

export default tarjetaComunRouter;
