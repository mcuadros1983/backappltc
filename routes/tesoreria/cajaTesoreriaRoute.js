import { Router } from "express";
import * as cajaTesoreriaController  from "../../controllers/tesoreria/cajaTesoreriaController.js";

const cajaTesoreriaRouter = Router();

cajaTesoreriaRouter.post("/caja-tesoreria/abrir", cajaTesoreriaController.abrirCaja);
cajaTesoreriaRouter.get("/caja-tesoreria/actual", cajaTesoreriaController.obtenerCajaAbierta);
cajaTesoreriaRouter.post("/caja-tesoreria/cerrar", cajaTesoreriaController.cerrarCaja);
cajaTesoreriaRouter.get("/caja-tesoreria/usuario/:usuario_id", cajaTesoreriaController.listarCajasPorUsuario); // opcional
cajaTesoreriaRouter.get("/caja-tesoreria/ultima-cerrada", cajaTesoreriaController.obtenerUltimaCajaCerrada);

export default cajaTesoreriaRouter;

