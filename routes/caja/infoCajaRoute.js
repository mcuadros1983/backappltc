import { Router } from 'express';
import * as infoCajaRindeController from '../../controllers/caja/infoCajaController.js';

const infoCajaRouter = Router();

// Rutas para caja
// infoCajaRouter.get('/caja/gastos', infoCajaRindeController.obtenerGastos);
// infoCajaRouter.post('/caja/gastos', infoCajaRindeController.crearGastos);
// infoCajaRouter.get('/caja/retiros', infoCajaRindeController.obtenerRetiros);
// infoCajaRouter.post('/caja/retiros', infoCajaRindeController.crearRetiros);
// infoCajaRouter.get('/caja/vales', infoCajaRindeController.obtenerVales);
// infoCajaRouter.post('/caja/vales', infoCajaRindeController.crearVales);
// infoCajaRouter.get('/caja/cupones', infoCajaRindeController.obtenerCupones);
// infoCajaRouter.post('/caja/cupones', infoCajaRindeController.crearCupones);
// infoCajaRouter.get('/caja/sueldos', infoCajaRindeController.obtenerSueldos);
// infoCajaRouter.post('/caja/sueldos', infoCajaRindeController.crearSueldos);
// infoCajaRouter.get('/caja/ingresos', infoCajaRindeController.obtenerIngresos);
// infoCajaRouter.post('/caja/ingresos', infoCajaRindeController.crearIngresos);
// infoCajaRouter.get('/caja/vtasctacte', infoCajaRindeController.obtenerVtasctasctes);
// infoCajaRouter.post('/caja/vtasctacte', infoCajaRindeController.crearVtasctasctes);
// infoCajaRouter.get('/caja/cobranzasctacte', infoCajaRindeController.obtenerCobranzasctasctes);
// infoCajaRouter.post('/caja/cobranzasctacte', infoCajaRindeController.crearCobranzasctasctes);


// Rutas para caja
infoCajaRouter.get('/caja/cajas', infoCajaRindeController.obtenerCajas);
infoCajaRouter.post('/caja/cajas_filtrados', infoCajaRindeController.obtenerCajasFiltrados);
infoCajaRouter.post('/caja/cajas', infoCajaRindeController.crearCajas);
infoCajaRouter.get('/caja/gastos', infoCajaRindeController.obtenerGastos);
infoCajaRouter.post('/caja/gastos_filtrados', infoCajaRindeController.obtenerGastosFiltrados);
infoCajaRouter.post('/caja/gastos', infoCajaRindeController.crearGastos);
infoCajaRouter.get('/caja/retiros', infoCajaRindeController.obtenerRetiros);
infoCajaRouter.post('/caja/retiros_filtrados', infoCajaRindeController.obtenerRetirosFiltrados);
infoCajaRouter.post('/caja/retiros', infoCajaRindeController.crearRetiros);
infoCajaRouter.get('/caja/vales', infoCajaRindeController.obtenerVales);
infoCajaRouter.post('/caja/vales_filtrados', infoCajaRindeController.obtenerValesFiltrados);
infoCajaRouter.post('/caja/vales', infoCajaRindeController.crearVales);
infoCajaRouter.get('/caja/cupones', infoCajaRindeController.obtenerCupones);
infoCajaRouter.post('/caja/cupones_filtrados', infoCajaRindeController.obtenerCuponesFiltrados);
infoCajaRouter.post('/caja/cupones', infoCajaRindeController.crearCupones);
infoCajaRouter.get('/caja/sueldos', infoCajaRindeController.obtenerSueldos);
infoCajaRouter.post('/caja/sueldos_filtrados', infoCajaRindeController.obtenerSueldosFiltrados);
infoCajaRouter.post('/caja/sueldos', infoCajaRindeController.crearSueldos);
infoCajaRouter.get('/caja/ingresos', infoCajaRindeController.obtenerIngresos);
infoCajaRouter.post('/caja/ingresos_filtrados', infoCajaRindeController.obtenerIngresosFiltrados);
infoCajaRouter.post('/caja/ingresos', infoCajaRindeController.crearIngresos);
infoCajaRouter.get('/caja/vtasctacte', infoCajaRindeController.obtenerVtasctasctes);
infoCajaRouter.post('/caja/vtasctacte_filtrados', infoCajaRindeController.obtenerVtasctasctesFiltradas);
infoCajaRouter.post('/caja/vtasctacte', infoCajaRindeController.crearVtasctasctes);
infoCajaRouter.get('/caja/cobranzasctacte', infoCajaRindeController.obtenerCobranzasctasctes);
infoCajaRouter.post('/caja/cobranzasctacte_filtrados', infoCajaRindeController.obtenerCobranzasctasctesFiltradas);
infoCajaRouter.post('/caja/cobranzasctacte', infoCajaRindeController.crearCobranzasctasctes);
infoCajaRouter.get('/caja/saldosctacte', infoCajaRindeController.obtenerSaldosCuentaCorriente);
infoCajaRouter.post('/caja/detalledecaja', infoCajaRindeController.obtenerDetalleDeCajaPorFechaYSucursal);

infoCajaRouter.post("/caja/cierres", infoCajaRindeController.crearCierre);
infoCajaRouter.get("/caja/cierres", infoCajaRindeController.obtenerCierres);
infoCajaRouter.post('/caja/cierres_filrados', infoCajaRindeController.obtenerCierresFiltrados);
infoCajaRouter.get("/caja/cierres/:id", infoCajaRindeController.obtenerCierrePorId);
infoCajaRouter.delete("/caja/cierres/:id", infoCajaRindeController.eliminarCierre);
infoCajaRouter.put("/caja/cierres/:id", infoCajaRindeController.actualizarCierre);


export default infoCajaRouter;