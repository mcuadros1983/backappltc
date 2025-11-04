import { Router } from "express";
import JWTAuth from "../middleware/jwtMiddleware.js";
import { attachPermissions } from "../middleware/attachPermissions.js";
import meRouter from "./auth/meRouter.js";
import * as indexController from "../controllers/gmedias/indexController.js";
import authRouter from "./auth/authRoute.js";
import tablasRouter from "./tablas/tablasRoute.js";
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
import bancoRouter from "./comun/bancoRoute.js";
import categoriaAnimalRouter from "./comun/categoriaAnimalRoute.js";
import empresaRouter from "./comun/empresaRoute.js";
import formaPagoRouter from "./comun/formapagoRoute.js";
import frigorificoRouter from "./comun/frigorificoRoute.js";
import imputacionContableRouter from "./comun/imputacionContableRoute.js";
import marcaTarjetaRouter from "./comun/marcaTarjetaRoute.js";
import proveedorRouter from "./comun/proveedorRoute.js";
import proyectoRouter from "./comun/proyectoRoute.js";
import ptoVentaRouter from "./comun/ptoVentaRoute.js";
import tarjetaComunRouter from "./comun/tarjetaComunRoute.js";
import tipoComprobanteRouter from "./comun/tipoComprobanteRoute.js";
import tipoTarjetaRouter from "./comun/tipoTarjetaRoute.js";
import criterioRouter from "./conciliacion/criterioRoute.js";
import cuentaRouter from "./conciliacion/cuentaRoute.js";
import registroBancoRouter from "./conciliacion/registroBancoRoute.js";
import rubroRouter from "./conciliacion/rubroRoute.js";
import haciendaRouter from "./gmedia/haciendaRoute.js";
import registroHaciendaRouter from "./gmedia/registroHaciendaRoute.js";
import cierreZIvaRouter from "./iva/cierreZIvaRoute.js";
import comprobanteEgresoRouter from "./iva/comprobanteEgresoRoute.js";
import comprobanteIngresoRouter from "./iva/comprobanteIngresoRoute.js";
import libroIVARouter from "./iva/libroIVARoute.js";
import compraRouter from "./sistfinanciero/compraRoute.js";
import ctaCteClienteRouter from "./sistfinanciero/ctaCteClienteRoute.js";
import ctaCteProveedorRouter from "./sistfinanciero/ctaCteProveedorRoute.js";
import deudaClienteRouter from "./sistfinanciero/deudaClienteRoute.js";
import deudaProveedorRouter from "./sistfinanciero/deudaProveedorRoute.js";
import estadoDeudaClienteRouter from "./sistfinanciero/estadoDeudaClienteRoute.js";
import estadoDeudaProveedorRouter from "./sistfinanciero/estadoDeudaProveedorRoute.js";
import pagoClienteRouter from "./sistfinanciero/pagoClienteRoute.js";
import pagoProveedorRouter from "./sistfinanciero/pagoProveedorRoute.js";
import adicionalSueldoRouter from "./sueldoempleado/adicionalSueldoRoute.js";
import descuentoSueldoRouter from "./sueldoempleado/descuentoSueldoRoute.js";
import pagoSueldoEmpleadoRouter from "./sueldoempleado/pagoSueldoEmpleadoRoute.js";
import sueldoEmpleadoRouter from "./sueldoempleado/sueldoEmpleadoRoute.js";
import valeEmpleadoRouter from "./sueldoempleado/valeEmpleadoRoute.js";
import cajaTesoreriaRouter from "./tesoreria/cajaTesoreriaRoute.js";
import categoriaEgresoRouter from "./tesoreria/categoriaEgresoRoute.js";
import categoriaIngresoRouter from "./tesoreria/categoriaIngresoRoute.js";
import egresoCajaRouter from "./tesoreria/egresoCajaRoute.js";
import ingresoCajaRouter from "./tesoreria/ingresoCajaRoute.js";
import retiroTesoreriaRouter from "./tesoreria/retiroTesoreriaRoute.js";
import cobroTarjetaCreditoRouter from "./tesoreria/cobroTarjetaCreditoRoute.js";
import movimientoBancoTesoreriaRouter from "./tesoreria/movimientoBancoTesoreriaRoute.js";
import movimientoCajaTesoreriaRouter from "./tesoreria/movimientoCajaTesoreriaRoute.js";
import tarjetaPlanPagoRouter from "./tesoreria/tarjetaPlanPagoRoute.js";
import pagoTransferenciaBancariaRouter from "./tesoreria/pagoTransferenciaBancariaRoute.js";
import pagoEcheqRouter from "./tesoreria/pagoEcheqRoute.js";
import movimientoCtaCteProveedorRouter from "./tesoreria/movimientoCtaCteProveedorRoute.js";
import ordenDePagoRouter from "./tesoreria/ordenDePagoRoute.js";
import pagoTarjetaCreditoRouter from "./tesoreria/pagoTarjetaCreditoRoute.js";
import adelantoEmpleadoRouter from "./sueldoempleado/adelantoEmpleadoRoute.js";
import adicionalFijoTipoRouter from "./sueldoempleado/adicionalFijoTipoRoute.js";
import adicionalFijoValorRouter from "./sueldoempleado/adicionalFijoValorRoute.js";
import empleadoAdicionalFijoRouter from "./sueldoempleado/empleadoAdicionalFijoRoute.js";
import adicionalVariableTipoRouter from "./sueldoempleado/adicionalVariableTipoRoute.js";
import adicionalVariableRouter from "./sueldoempleado/adicionalVariableRoute.js";
import periodoLiquidacionRouter from "./sueldoempleado/periodoLiquidacionRoute.js";
import liquidacionRouter from "./sueldoempleado/liquidacionRoute.js";
import adicionalVariableImportRouter from "./sueldoempleado/adicionalVariableImportRoute.js";
import liquidacionImportRouter from "./sueldoempleado/liquidacionImportRoute.js";
import telefonoEmpleadoRouter from "./tablas/telefonoEmpleadoRoute.js";
import reciboLinkRouter from "./sueldoempleado/recibosLinkRoute.js";
import reciboPublicRouter from "./sueldoempleado/reciboPublicRoute.js";
import reciboPublicHtmlRouter from "./sueldoempleado/reciboPublicHtmlRoute.js";
import CompraProyectadaRouter from "./iva/compraProyectadaRoute.js";
import gastoEstimadoRouter from "./tesoreria/gastoEstimadoRoute.js";
import gastoEstimadoReportesRouter from "./tesoreria/gastoEstimadoReportesRoute.js";
import disponiblesRouter from "./tesoreria/disponiblesRoute.js";
import agendaRouter from "./agenda/agendaRoutes.js"
import auditoriaRouter from "./auditoria/auditoriaRoute.js"
import registroPrecioRouter from "./statics/registroPrecioRoute.js"
import datosEmpleadoRouter from "./tablas/datosEmpleadoRoute.js";
import navRouter from "./nav/navRoute.js";
import asistenciasRouter from "./asistencia/asistenciasRoute.js"
import dispositivosRouter from "./asistencia/dispositivosRoute.js"
import embeddingsRouter from "./asistencia/embeddingsRoute.js"
import metricasRouter from "./asistencia/metricasRoute.js"
import parametrosRouter from "./asistencia/parametrosRoute.js"
import turnosRouter from "./asistencia/turnosRoute.js"
import jornadasRouter from "./asistencia/jornadasRoute.js"
import horarioTurnoRouter from "./asistencia/horarioTurnoRoute.js";
import huellaNavegadorRouter from "./asistencia/huellaNavegadorRoute.js";
import asignacionVacacionesRouter from "./asistencia/asignacionVacacionesRoute.js";
import conceptoRouter from "./asistencia/conceptoRoute.js";
import eventoRouter from "./asistencia/eventoRoute.js";
import documentosRouter from "./documentacion/documentosRoute.js";
import documentosUploadRouter from "./documentacion/documentosUploadRoute.js";
import proyeccionConfigRouter from "./proyeccion/proyeccionConfigRoute.js";
import proyeccionRouter from "./proyeccion/proyeccionRoute.js";


const router = Router();

const indexRouter = Router();
// const router = Router();

indexRouter.get("/", JWTAuth, indexController.index);
router.use(authRouter);


router.use(tablasRouter);
router.use(syncRouter);
router.use(registroPrecioRouter);
router.use(ventasRindeRouter);
router.use(infoCajaRouter);
router.use(mensajeRouter);
router.use(ventaStaticsRouter);
router.use(auditoriaRouter);
router.use(datosEmpleadoRouter);
router.use(turnosRouter);
router.use(jornadasRouter);
router.use(asistenciasRouter);
router.use(disponiblesRouter);
router.use(embeddingsRouter);
router.use(metricasRouter);
router.use(parametrosRouter);
router.use(horarioTurnoRouter);
router.use(huellaNavegadorRouter);
router.use(asignacionVacacionesRouter);
router.use(conceptoRouter);
router.use(eventoRouter);
router.use(documentosRouter);
router.use(documentosUploadRouter);
router.use(proyeccionConfigRouter);
router.use(proyeccionRouter);
router.use(cierreZIvaRouter);

// 🔐 A partir de acá, todo autenticado:
router.use(JWTAuth, attachPermissions);
router.use(indexRouter);
router.use(meRouter);
router.use(agendaRouter);
router.use(usuariosRouter);
router.use(rolesRouter)
router.use(sucursalesRouter);
router.use(mantenimientoRouter);
router.use(mantenimientoPreventivoRouter);
router.use(ordenMantenimientoRouter);
router.use(revisionItemRouter);
router.use(itemEquipoRouter);
router.use(rindeRouter);
router.use(ingresosRouter);
router.use(scheduleRouter);
router.use(equipoRouter);
router.use(categoriaEquipoRouter);

//COMUN
router.use(bancoRouter);
//router.use(bancoRouter);
router.use(categoriaAnimalRouter);
// router.use(categoriaAnimalRouter);
router.use(empresaRouter);
//router.use(empresaRouter);
router.use(formaPagoRouter);
// router.use(formaPagoRouter);
router.use(frigorificoRouter);
// router.use(frigorificoRouter);
router.use(imputacionContableRouter);
// router.use(imputacionContableRouter);
router.use(marcaTarjetaRouter);
// router.use(marcaTarjetaRouter);
router.use(proveedorRouter);
// router.use(proveedorRouter);
router.use(proyectoRouter);
// router.use(proyectoRouter);
router.use(ptoVentaRouter);
// router.use(ptoVentaRouter);
router.use(tarjetaComunRouter);
// router.use(tarjetaComunRouter);
router.use(tipoComprobanteRouter);
// router.use(tipoComprobanteRouter);
router.use(tipoTarjetaRouter);
// router.use(tipoTarjetaRouter);
//CONCILIACION
router.use(criterioRouter);
// router.use(criterioRouter);
router.use(cuentaRouter);
// router.use(cuentaRouter);
router.use(registroBancoRouter);
// router.use(registroBancoRouter);
router.use(rubroRouter);
// router.use(rubroRouter);

//GMEDIA
router.use(haciendaRouter);
//router.use(haciendaRouter); // 🔐 protegida
router.use(registroHaciendaRouter); // 🔓 Ruta libre
// router.use(registroHaciendaRouter);

//IVA

// router.use(cierreZIvaRouter); // 🔐 Ruta protegida
router.use(comprobanteEgresoRouter);
// router.use(comprobanteEgresoRouter);
router.use(comprobanteIngresoRouter);
// router.use(comprobanteIngresoRouter);
router.use(libroIVARouter);
// router.use(libroIVARouter);

// SISTFINANCIERO
router.use(compraRouter);
// router.use(compraRouter);
router.use(ctaCteClienteRouter);
// router.use(ctaCteClienteRouter);
router.use(ctaCteProveedorRouter);
// router.use(ctaCteProveedorRouter);
router.use(deudaClienteRouter);
// router.use(deudaClienteRouter);
router.use(deudaProveedorRouter);
// router.use(deudaProveedorRouter);
router.use(estadoDeudaClienteRouter);
// router.use(estadoDeudaClienteRouter); 
router.use(estadoDeudaProveedorRouter);
// router.use(estadoDeudaProveedorRouter);
router.use(pagoClienteRouter);
// router.use(pagoClienteRouter);
router.use(pagoProveedorRouter);
// router.use(pagoProveedorRouter);

//SUELDOEMPLEADO
router.use(adicionalSueldoRouter);
// router.use(adicionalSueldoRouter);
router.use(descuentoSueldoRouter);
router.use(pagoSueldoEmpleadoRouter);
router.use(sueldoEmpleadoRouter);
router.use(valeEmpleadoRouter);

// TESORERIA
router.use(cajaTesoreriaRouter);
router.use(categoriaEgresoRouter);
router.use(categoriaIngresoRouter);
router.use(egresoCajaRouter);
router.use(tarjetaPlanPagoRouter);
router.use(ingresoCajaRouter);
router.use(retiroTesoreriaRouter);
router.use(cobroTarjetaCreditoRouter);
router.use(movimientoBancoTesoreriaRouter);
router.use(movimientoCajaTesoreriaRouter);
router.use(pagoTransferenciaBancariaRouter);
router.use(pagoEcheqRouter);
router.use(movimientoCtaCteProveedorRouter);
router.use(ordenDePagoRouter);
router.use(pagoTarjetaCreditoRouter);
router.use(adelantoEmpleadoRouter);

// --- Sueldo Empleado ---
router.use(adicionalFijoTipoRouter);
router.use(adicionalFijoValorRouter);
router.use(empleadoAdicionalFijoRouter);
router.use(adicionalVariableTipoRouter);
router.use(adicionalVariableRouter);
router.use(periodoLiquidacionRouter);
router.use(liquidacionRouter);
router.use(adicionalVariableImportRouter);
router.use(liquidacionImportRouter);
router.use(telefonoEmpleadoRouter);
router.use(reciboLinkRouter);
router.use(reciboPublicRouter);
router.use(reciboPublicHtmlRouter);
router.use(CompraProyectadaRouter);
router.use(gastoEstimadoRouter);
router.use(gastoEstimadoReportesRouter);
router.use(disponiblesRouter);
router.use(navRouter);

router.use(clientesRouter);
router.use(cobranzasRouter);
router.use(cuentasCorrientesRouter);
router.use(detallesCobranzasRouter);
router.use(detallesCuentasCorrientesRouter);
router.use(formasPagoRouter);
router.use(ordenesRouter);
router.use(productosRouter);
router.use(ventasRouter);



export default router;
