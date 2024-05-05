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
