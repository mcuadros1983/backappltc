// models/index.js

// Core
import { sequelize } from "../config/database.js";

// Módulo: cajatesoreria
import CajaTesoreria from "./tesoreria/cajatesoreria.js";
import MovimientoCajaTesoreria from "./tesoreria/movimientocajatesoreria.js";
import IngresoCaja from "./tesoreria/ingresocaja.js";
import EgresoCaja from "./tesoreria/egresocaja.js";

// Módulo: tesoreria
import CategoriaEgreso from "./tesoreria/categoriaEgreso.js";
import CategoriaIngreso from "./tesoreria/categoriaEgreso.js";

// Módulo: comun
import Banco from "./comun/banco.js";
import TarjetaComun from "./comun/tarjetacomun.js";
import Proyecto from "./comun/proyecto.js";
import Proveedor from "./comun/proveedor.js";

// Módulo: conciliacion
import ConciliacionRegistroBanco from "./conciliacion/registrobanco.js";

// Módulo: sueldoempleado
import SueldoEmpleado from "./sueldoempleado/sueldoempleado.js";
import AdelantoEmpleado from "./sueldoempleado/AdelantoEmpleado.js";

// Módulo: iva
import ComprobanteEgreso from "./iva/comprobanteegreso.js";
import ComprobanteIngreso from "./iva/comprobanteingreso.js";

// Módulo: sistfinanciero
import PagoProveedor from "./sistfinanciero/pagoproveedor.js";

// Módulo: tablas
import EmpleadoTabla from "./tablas/empleadoModel.js";
import ClientePersonaTabla from "./tablas/clientePersonaModel.js";

// Módulo: gmedias
import Sucursal from "./gmedias/sucursalModel.js";
import PagoTarjetaCredito from "./tesoreria/pagotarjetacredito.js";

// asociaciones.js (ejemplo)
import OrdenPago from "../models/tesoreria/ordendepago.js";

// models/index.js o donde definas asociaciones
import Hacienda from "../models/gmedia/hacienda.js";
import RegistroHacienda from "../models/gmedia/registrohacienda.js";

import RetiroTesoreria from "../models/tesoreria/retirotesoreria.js";

// associations.js

import AdicionalFijoTipo from "../models/sueldoempleado/adicionalfijotipo.js";
import AdicionalFijoValor from "../models/sueldoempleado/adicionalfijovalor.js";
import EmpleadoAdicionalFijo from "../models/sueldoempleado/empleadoadicionalfijo.js";
import AdicionalVariable from "../models/sueldoempleado/adicionalvariable.js";
import PeriodoLiquidacion from "../models/sueldoempleado/periodoliquidacion.js";
import Recibo from "../models/sueldoempleado/recibo.js";
import ReciboItem from "../models/sueldoempleado/reciboitem.js";
import AdicionalVariableTipo from "./sueldoempleado/adicionalvariabletipo.js";

import GastoEstimado from "./tesoreria/gastoestimado.js";
import GastoEstimadoInstancia from "./tesoreria/gastoestimadoinstancia.js";
import GastoEstimadoPago from "./tesoreria/gastoestimadopago.js";
import { registerAuditHooks } from "../boot/auditHooks.js";
import RegistroPrecio from "./statics/registroPrecioModel.js"

import DatosEmpleado from "./tablas/datosEmpleadoModel.js"; // 👈 nuevo

import { Dispositivo } from './asistencia/Dispositivo.js';
import { Turno } from './asistencia/Turno.js';
import { Parametro } from './asistencia/Parametro.js';
import { EmpleadoEmbedding } from './asistencia/EmpleadoEmbedding.js';
import { Asistencia } from './asistencia/Asistencia.js';

import HuellaNavegador from "./asistencia/huellaNavegador.js";
import AsignacionVacaciones from "./asistencia/asignacionVacaciones.js";
import HorarioTurno from "./asistencia/HorarioTurno.js";

registerAuditHooks(sequelize);

// Relaciones para MovimientoCajaTesoreria
MovimientoCajaTesoreria.belongsTo(CajaTesoreria, { foreignKey: "caja_id" });
MovimientoCajaTesoreria.belongsTo(CategoriaEgreso, { foreignKey: "categoriaegreso_id" });
MovimientoCajaTesoreria.belongsTo(CategoriaIngreso, { foreignKey: "categoriaingreso_id" });
MovimientoCajaTesoreria.belongsTo(Banco, { foreignKey: "banco_id" });
MovimientoCajaTesoreria.belongsTo(ConciliacionRegistroBanco, { foreignKey: "registrobanco_id" });
MovimientoCajaTesoreria.belongsTo(EmpleadoTabla, { foreignKey: "empleado_id" });
MovimientoCajaTesoreria.belongsTo(Proveedor, { foreignKey: "proveedor_id" });
MovimientoCajaTesoreria.belongsTo(ClientePersonaTabla, { foreignKey: "cliente_id" });
MovimientoCajaTesoreria.belongsTo(Proyecto, { foreignKey: "proyecto_id" });
MovimientoCajaTesoreria.belongsTo(Sucursal, { foreignKey: "sucursal_id" });
MovimientoCajaTesoreria.belongsTo(TarjetaComun, { foreignKey: "tarjeta_id" });
MovimientoCajaTesoreria.belongsTo(ComprobanteEgreso, { foreignKey: "comprobanteegreso_id" });
MovimientoCajaTesoreria.belongsTo(ComprobanteIngreso, { foreignKey: "comprobanteingreso_id" });
MovimientoCajaTesoreria.belongsTo(PagoProveedor, { foreignKey: "pagoproveedor_id" });
MovimientoCajaTesoreria.belongsTo(SueldoEmpleado, { foreignKey: "sueldo_id" });
MovimientoCajaTesoreria.belongsTo(AdelantoEmpleado, { foreignKey: "adelanto_id" });

// Relación CajaTesoreria con MovimientoCajaTesoreria
CajaTesoreria.hasMany(MovimientoCajaTesoreria, { foreignKey: "caja_id" });

CajaTesoreria.hasMany(IngresoCaja, { foreignKey: "caja_id" });
IngresoCaja.belongsTo(CajaTesoreria, { foreignKey: "caja_id" });

CajaTesoreria.hasMany(EgresoCaja, { foreignKey: "caja_id" });
EgresoCaja.belongsTo(CajaTesoreria, { foreignKey: "caja_id" });

ComprobanteEgreso.hasMany(PagoTarjetaCredito, {
  as: "pagosTarjeta",
  foreignKey: "comprobanteegreso_id",
});
PagoTarjetaCredito.belongsTo(ComprobanteEgreso, {
  as: "comprobante",
  foreignKey: "comprobanteegreso_id",
});

// OrdenPago ↔ MovimientoCajaTesoreria (1–N)
OrdenPago.hasMany(MovimientoCajaTesoreria, {
  foreignKey: "ordenpago_id",
  as: "movimientosCaja",
});
MovimientoCajaTesoreria.belongsTo(OrdenPago, {
  foreignKey: "ordenpago_id",
  as: "ordenPago",
});

// OrdenPago ↔ ComprobanteEgreso (N–1, una orden puede aplicarse a 1 comp)
ComprobanteEgreso.hasMany(OrdenPago, {
  foreignKey: "comprobanteegreso_id",
  as: "ordenesPago",
});
OrdenPago.belongsTo(ComprobanteEgreso, {
  foreignKey: "comprobanteegreso_id",
  as: "comprobante",
});

// CategoriaEgreso ↔ MovimientoCajaTesoreria (1–N)
CategoriaEgreso.hasMany(MovimientoCajaTesoreria, {
  foreignKey: "categoriaegreso_id",
  as: "movimientosCaja",
});
MovimientoCajaTesoreria.belongsTo(CategoriaEgreso, {
  foreignKey: "categoriaegreso_id",
  as: "categoriaEgreso",
});

TarjetaComun.hasMany(PagoTarjetaCredito, { foreignKey: "tarjetacomun_id" });
PagoTarjetaCredito.belongsTo(TarjetaComun, { foreignKey: "tarjetacomun_id", as: "tarjeta" });

Hacienda.hasMany(RegistroHacienda, { foreignKey: "hacienda_id", as: "items" });
RegistroHacienda.belongsTo(Hacienda, { foreignKey: "hacienda_id", as: "hacienda" });

// RetiroTesoreria ↔ Sucursal
RetiroTesoreria.belongsTo(Sucursal, {
  foreignKey: "sucursal_id",
  as: "sucursal",
});
Sucursal.hasMany(RetiroTesoreria, {
  foreignKey: "sucursal_id",
  as: "retirosTesoreria",
});

// RetiroTesoreria ↔ MovimientoCajaTesoreria (opcional pero recomendado)
RetiroTesoreria.belongsTo(MovimientoCajaTesoreria, {
  foreignKey: "movimiento_id",
  as: "movimiento",
});
MovimientoCajaTesoreria.hasMany(RetiroTesoreria, {
  foreignKey: "movimiento_id",
  as: "retiros",
});

// Fijos
EmpleadoTabla.hasMany(EmpleadoAdicionalFijo, { foreignKey: "empleado_id" });
EmpleadoAdicionalFijo.belongsTo(EmpleadoTabla, { foreignKey: "empleado_id" });

AdicionalFijoTipo.hasMany(EmpleadoAdicionalFijo, { foreignKey: "adicionalfijotipo_id" });
EmpleadoAdicionalFijo.belongsTo(AdicionalFijoTipo, { foreignKey: "adicionalfijotipo_id" });

AdicionalFijoTipo.hasMany(AdicionalFijoValor, { foreignKey: "adicionalfijotipo_id" });
AdicionalFijoValor.belongsTo(AdicionalFijoTipo, { foreignKey: "adicionalfijotipo_id" });

Recibo.belongsTo(EmpleadoTabla, { as: "Empleado", foreignKey: "empleado_id" });
EmpleadoTabla.hasMany(Recibo, { as: "Recibos", foreignKey: "empleado_id" });

Recibo.belongsTo(PeriodoLiquidacion, { as: "Periodo", foreignKey: "periodo_id" });
PeriodoLiquidacion.hasMany(Recibo, { as: "Recibos", foreignKey: "periodo_id" });

Recibo.hasMany(ReciboItem, {
  foreignKey: "recibo_id", as: "Items"
},);
ReciboItem.belongsTo(Recibo, { foreignKey: "recibo_id", as: "Recibo" });

// belongsTo hacia Empleado (alias único para AdicionalVariable)
AdicionalVariable.belongsTo(EmpleadoTabla, {
  foreignKey: "empleado_id",
  as: "EmpleadoAV",
});

// hasMany desde Empleado -> AdicionalVariable (alias único)
EmpleadoTabla.hasMany(AdicionalVariable, {
  foreignKey: "empleado_id",
  as: "AdicionalesVariablesPorEmpleado",
});

// belongsTo hacia PeriodoLiquidacion (alias único)
AdicionalVariable.belongsTo(PeriodoLiquidacion, {
  foreignKey: "periodo_id",
  as: "PeriodoAV",
});

// hasMany desde Periodo -> AdicionalVariable (alias distinto al anterior)
PeriodoLiquidacion.hasMany(AdicionalVariable, {
  foreignKey: "periodo_id",
  as: "AdicionalesVariablesPorPeriodo",
});

// belongsTo hacia AdicionalVariableTipo (NUEVA asociación + alias)
AdicionalVariable.belongsTo(AdicionalVariableTipo, {
  foreignKey: "adicionalvariabletipo_id",
  as: "TipoAV",
});

// hasMany desde Tipo -> AdicionalVariable (alias único)
AdicionalVariableTipo.hasMany(AdicionalVariable, {
  foreignKey: "adicionalvariabletipo_id",
  as: "AdicionalesVariablesPorTipo",
});



GastoEstimado.hasMany(GastoEstimadoInstancia, { foreignKey: "gastoestimado_id", as: "instancias" });
GastoEstimadoInstancia.belongsTo(GastoEstimado, { foreignKey: "gastoestimado_id", as: "gastoestimado" });

GastoEstimadoInstancia.hasMany(GastoEstimadoPago, { foreignKey: "gastoestimado_instancia_id", as: "pagos" });
GastoEstimadoPago.belongsTo(GastoEstimadoInstancia, { foreignKey: "gastoestimado_instancia_id", as: "instancia" });

// --- GastoEstimado → Proveedor / Categoria / (Sucursal opcional) ---
GastoEstimado.belongsTo(Proveedor, {
  foreignKey: "proveedor_id",
  // as: "Proveedor"   // NO pongas 'as' si no lo vas a usar en los include
});
Proveedor.hasMany(GastoEstimado, { foreignKey: "proveedor_id" });

GastoEstimado.belongsTo(CategoriaEgreso, {
  foreignKey: "categoriaegreso_id",
  // as: "CategoriaEgreso"
});
CategoriaEgreso.hasMany(GastoEstimado, { foreignKey: "categoriaegreso_id" });

// --- Pagos de gasto estimado ---
// Asegurate que el modelo GastoEstimadoPago tenga la FK 'gastoestimado_id'
GastoEstimado.hasMany(GastoEstimadoPago, {
  as: "pagos",
  foreignKey: "gastoestimado_id",
});
GastoEstimadoPago.belongsTo(GastoEstimado, {
  as: "gasto",
  foreignKey: "gastoestimado_id",
});

GastoEstimado.hasMany(GastoEstimadoInstancia, { foreignKey: "gastoestimado_id" });
GastoEstimadoInstancia.belongsTo(GastoEstimado, { foreignKey: "gastoestimado_id" });

GastoEstimadoInstancia.hasMany(GastoEstimadoPago, { foreignKey: "gastoestimado_instancia_id" });
GastoEstimadoPago.belongsTo(GastoEstimadoInstancia, { foreignKey: "gastoestimado_instancia_id" });

GastoEstimadoInstancia.belongsTo(Proveedor, { foreignKey: "proveedor_id" });
GastoEstimadoInstancia.belongsTo(CategoriaEgreso, { foreignKey: "categoriaegreso_id" });
// si tenés Sucursal/Empresa, podés agregar los belongsTo equivalentes

// ---- Relaciones de DatosEmpleado ----
EmpleadoTabla.hasOne(DatosEmpleado, {
  foreignKey: "empleado_id",
  as: "datos",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});
DatosEmpleado.belongsTo(EmpleadoTabla, {
  foreignKey: "empleado_id",
  as: "empleado",
});

Sucursal.hasMany(DatosEmpleado, {
  foreignKey: "sucursal_id",
  as: "datosEmpleados",
});
DatosEmpleado.belongsTo(Sucursal, {
  foreignKey: "sucursal_id",
  as: "sucursal",
});


// Relaciones
Sucursal.hasMany(EmpleadoTabla, { foreignKey: 'sucursal_id' });
EmpleadoTabla.belongsTo(Sucursal, { foreignKey: 'sucursal_id' });

Turno.hasMany(EmpleadoTabla, { foreignKey: 'turno_id' });
EmpleadoTabla.belongsTo(Turno, { foreignKey: 'turno_id' });

Sucursal.hasMany(Dispositivo, { foreignKey: 'sucursal_id' });
Dispositivo.belongsTo(Sucursal, { foreignKey: 'sucursal_id' });

EmpleadoTabla.hasMany(EmpleadoEmbedding, { foreignKey: 'empleado_id' });
EmpleadoEmbedding.belongsTo(EmpleadoTabla, { foreignKey: 'empleado_id' });

EmpleadoTabla.hasMany(Asistencia, { foreignKey: 'empleado_id' });
Asistencia.belongsTo(EmpleadoTabla, { foreignKey: 'empleado_id' });

Sucursal.hasMany(Asistencia, { foreignKey: 'sucursal_id' });
Asistencia.belongsTo(Sucursal, { foreignKey: 'sucursal_id' });


// Exportar todos los modelos por si se necesita en otros módulos
export {
  sequelize,
  CajaTesoreria,
  MovimientoCajaTesoreria,
  CategoriaEgreso,
  CategoriaIngreso,
  Banco,
  ConciliacionRegistroBanco,
  EmpleadoTabla,
  ClientePersonaTabla,
  Proyecto,
  Proveedor,
  Sucursal,
  TarjetaComun,
  PagoTarjetaCredito,
  ComprobanteEgreso,
  ComprobanteIngreso,
  PagoProveedor,
  SueldoEmpleado,
  AdelantoEmpleado,
  Hacienda,
  RegistroHacienda,
  RetiroTesoreria,
  EmpleadoAdicionalFijo,
  AdicionalFijoTipo,
  AdicionalFijoValor,
  AdicionalVariable,
  PeriodoLiquidacion,
  Recibo,
  ReciboItem,
  AdicionalVariableTipo,
  GastoEstimado,
  GastoEstimadoPago,
  GastoEstimadoInstancia,
  RegistroPrecio,
  DatosEmpleado,
  Dispositivo, Turno, Parametro, EmpleadoEmbedding, Asistencia,
  HuellaNavegador,
  HorarioTurno,
  AsignacionVacaciones
};

