import { Router } from "express";
import JWTAuth from "../middleware/jwtMiddleware.js";
import * as indexController from "../controllers/gmedias/indexController.js";
import authRouter from "./auth/authRoute.js";
import clientesRouter from "./gmedias/clientesRoute.js";
import cobranzasRouter from "./gmedias/cobranzasRoute.js";
import cuentasCorrientesRouter from "./gmedias/cuentasCorrientesRoute.js";
import detallesCobranzasRouter from "./gmedias/detallesCobranzasRoute.js";
import detallesCuentasCorrientesRouter from "./gmedias/detallesCuentasCorrientesRoute.js";
import formasPagoRouter from "./gmedias/formasPagoRoute.js";
import ingresosRouter from "./gmedias/ingresosRoute.js";
import ordenesRouter from "./gmedias/ordenesRoute.js";
import productosRouter from "./gmedias/productosRoute.js";
import sucursalesRouter from "./gmedias/sucursalesRoute.js";
import ventasRouter from "./gmedias/ventasRoute.js";
import usuariosRouter from "./auth/usuariosRoute.js";
import rolesRouter from "./auth/rolesRoute.js";
import ventasRindeRouter from "./rinde/ventasRindeRoute.js"
import infoCajaRouter from "./caja/infoCajaRoute.js";
import rindeRouter from "./rinde/rindeRoute.js";
import tablasRouter from "./tablas/tablasRoute.js";
import equipoRouter from "./mantenimiento/equipoRoute.js";
import categoriaEquipoRouter from "./mantenimiento/categoriaEquipoRoute.js";
import mantenimientoRouter from "./mantenimiento/mantenimientoRoute.js";
import mantenimientoPreventivoRouter from "./mantenimiento/mantenimientoPreventivoRoute.js";
import ordenMantenimientoRouter from "./mantenimiento/ordenMantenimientoRoute.js";
import revisionItemRouter from "./mantenimiento/revisionItemRoute.js";
import itemEquipoRouter from "./mantenimiento/itemEquipoRoute.js";
import mensajeRouter from "./caja/mensajeRoute.js";
import scheduleRouter from "./caja/scheduleRoute.js";
import syncRouter from "./sync/syncRoute.js";
import ventaStaticsRouter from "./statics/ventaStaticsRoute.js";
const router = Router();

const indexRouter = Router();
// const router = Router();

indexRouter.get("/", JWTAuth, indexController.index);

router.use(indexRouter);
router.use(authRouter);
router.use(usuariosRouter);
router.use(rolesRouter)
router.use(sucursalesRouter);
router.use(ventasRindeRouter);
router.use(rindeRouter);
router.use(tablasRouter);
router.use(ingresosRouter);
router.use(infoCajaRouter);
router.use(mensajeRouter);
router.use(scheduleRouter);
router.use(equipoRouter);
router.use(categoriaEquipoRouter);
router.use(mantenimientoRouter);
router.use(mantenimientoPreventivoRouter);
router.use(ordenMantenimientoRouter);
router.use(revisionItemRouter);
router.use(itemEquipoRouter);
router.use(ventaStaticsRouter);
router.use(syncRouter);

router.use(JWTAuth, clientesRouter);
router.use(JWTAuth, cobranzasRouter);
router.use(JWTAuth, cuentasCorrientesRouter);
router.use(JWTAuth, detallesCobranzasRouter);
router.use(JWTAuth, detallesCuentasCorrientesRouter);
router.use(JWTAuth, formasPagoRouter);
router.use(JWTAuth, ordenesRouter);
router.use(JWTAuth, productosRouter);
router.use(JWTAuth, ventasRouter);


export default router;
