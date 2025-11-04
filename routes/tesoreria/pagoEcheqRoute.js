// routes/tesoreria/pagoEcheqRoutes.js
import { Router } from "express";
import * as controller from "../../controllers/tesoreria/pagoEcheqController.js";

const echeqEmitidoRouter = Router();

/* ---- Acciones de negocio (antes de :id) ---- */
echeqEmitidoRouter.post("/echeqs-emitidos/egresos-independientes", controller.registrarEgresoEcheqIndependiente);
echeqEmitidoRouter.post("/echeqs-emitidos/anticiposaproveedores", controller.registrarAnticipoProveedorEcheq);
echeqEmitidoRouter.post("/echeqs-emitidos/:id(\\d+)/acreditar", controller.acreditarEcheq);
echeqEmitidoRouter.post("/echeqs-emitidos/:id(\\d+)/rechazar", controller.rechazarEcheq);
echeqEmitidoRouter.post("/echeqs-emitidos/:id(\\d+)/anular", controller.anularEcheq);

/* -------------- CRUD / Listado -------------- */
echeqEmitidoRouter.get("/echeqs-emitidos", controller.listarEcheqsEmitidos);
echeqEmitidoRouter.get("/echeqs-emitidos/:id(\\d+)", controller.obtenerEcheqEmitidoPorId);
echeqEmitidoRouter.put("/echeqs-emitidos/:id(\\d+)", controller.actualizarEcheqEmitido);
echeqEmitidoRouter.delete("/echeqs-emitidos/:id(\\d+)", controller.eliminarEcheqEmitido);

export default echeqEmitidoRouter;
