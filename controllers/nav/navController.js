

import Usuario from "../../models/auth/usuarioModel.js";

/** --- Mapea path → permiso requerido --- */
function inferPerm(path = "") {
  const p = path.trim().toLowerCase();

  // ===== Config =====
  if (p === "/users") return "config:users.list";
  if (p === "/users/new") return "config:users.create";
  if (p === "/banks") return "config:bancos.view";
  if (p === "/empresas") return "config:empresas.view";
  if (p === "/frigorificos") return "config:frigorificos.view";
  if (p === "/librosiva") return "iva:libro.view";
  if (p === "/librosiva/new") return "iva:libro.create";
  if (p === "/compraproyectada") return "iva:compras.proyectadas.view";
  if (p === "/ivaproyeccion") return "iva:proyeccion.view";
  if (p === "/categorias-animales") return "config:categoriasAnimales.view";
  if (p === "/tarjetas-comunes") return "config:tarjetasComunes.view";
  if (p === "/tarjeta-planes") return "config:tarjetaPlanes.view";
  if (p === "/formas-pago-tesoreria") return "config:formasPago.view";
  if (p === "/imputaciones-contables") return "config:imputacionesContables.view";
  if (p === "/marcas-tarjeta") return "config:marcasTarjeta.view";
  if (p === "/tipos-tarjeta") return "config:tiposTarjeta.view";
  if (p === "/tipos-comprobantes") return "config:tiposComprobantes.view";
  if (p === "/ptos-venta") return "config:ptosVenta.view";
  if (p === "/proveedores") return "config:proveedores.view";
  if (p === "/proyectos") return "config:proyectos.view";
  if (p === "/periodoliquidacion") return "config:periodos.view";
  if (p === "/sync") return "config:sync.run";
  if (p === "/registros") return "config:registros.view";

  // ===== Gestión de Medias =====
  if (p === "/registrohacienda") return "gmedias:registro.view";

  if (p === "/sells") return "gmedias:venta.view";
  if (p === "/sells/new") return "gmedias:venta.create";

  if (p === "/products") return "gmedias:producto.view";
  if (p === "/products/new") return "gmedias:producto.create";
  if (p === "/products_update") return "gmedias:producto.update";
  if (p === "/products_update_tropa") return "gmedias:producto.update.tropa";
  if (p === "/products/verificar-tropa") return "gmedias:producto.verify.tropa";

  if (p === "/branches") return "gmedias:sucursal.view";
  if (p === "/customers") return "gmedias:cliente.view";
  if (p === "/customers/new") return "gmedias:cliente.create";

  if (p === "/waypays") return "gmedias:formaPago.view";
  if (p === "/waypays/new") return "gmedias:formaPago.create";

  if (p === "/accounts/new") return "gmedias:ctacte.registros";
  if (p === "/accounts") return "gmedias:ctacte.view";

  if (p === "/stock") return "gmedias:stock.view";
  if (p === "/stock/central") return "gmedias:stock.central.view";

  if (p === "/orders/new") return "gmedias:orden.create";
  if (p === "/orders") return "gmedias:orden.view";
  if (p === "/orders/productsfromexcel") return "gmedias:orden.import.excel";

  if (p === "/receipts/new") return "gmedias:ingreso.create";
  if (p === "/receipts") return "gmedias:ingreso.view";
  if (p === "/receipts/products") return "gmedias:ingreso.productos.view";

  // ===== Estadísticas / Ventas =====
  if (p === "/precioshistoricos") return "stats:prices.historic.view";
  if (p === "/sells/totalcomparativo") return "stats:sales.comparative.view";
  if (p === "/sells/comparativorangos") return "stats:sales.range.view";
  if (p === "/sells/graficoventas") return "stats:sales.chart.view";
  if (p === "/sells/total") return "stats:sales.total.view";
  if (p === "/sells/customers") return "stats:sales.byCustomer.view";
  if (p === "/sells/deleted") return "stats:sales.deleted.view";
  if (p === "/sells/discount") return "stats:sales.discount.view";
  if (p === "/sells/articles") return "stats:sales.byArticle.view";
  if (p === "/sells/user") return "stats:sales.byUser.view";
  if (p === "/sells/kg_branch") return "stats:sales.kgByBranch.view";
  if (p === "/sells/quantity") return "stats:sales.ticketCount.view";
  if (p === "/inventory/stock") return "stats:inventory.stock.view";

  // ===== RRHH / Asistencia =====
  if (p === "/dashboardasistencias") return "asistencia:dashboard.view";
  if (p === "/asistencias/conceptos") return "asistencia:concepto.manage";
  if (p === "/asistencias/eventos") return "asistencia:evento.manage";
  if (p === "/asistencias/listarvacaciones") return "asistencia:vacacion.view";
  if (p === "/asistencias/planificacion") return "asistencia:planificacion.manage";
  if (p === "/asistencias/horarios") return "asistencia:horario.manage";
  if (p === "/asistencias/asignarempleado") return "asistencia:asignacion.manage";
  if (p === "/asistencias/huellanavegador") return "asistencia:fingerprint.manage";
  if (p === "/asistencias") return "asistencia:view";
  if (p === "/jornadasasistencias") return "asistencia:jornada.manage";
  if (p === "/parametrosasistencias") return "asistencia:parametro.manage";

  // ===== Tesorería =====
  if (p === "/tesoreria/cajas/apertura") return "tesoreria:caja.open";
  if (p === "/tesoreria/movimientos-caja-tesoreria") return "tesoreria:caja.view";
  if (p === "/tesoreria/retirossucursales") return "tesoreria:retiros.view";
  if (p === "/tesoreria/movimientos-banco-tesoreria") return "tesoreria:banco.view";
  if (p === "/tesoreria/movimientos-banco-tesoreria-excel") return "tesoreria:banco.import";
  if (p === "/tesoreria/movimientos-tarjetas-tesoreria") return "tesoreria:tarjeta.view";
  if (p === "/tesoreria/movimientos-echeq-tesoreria") return "tesoreria:cheque.view";
  if (p === "/gastosestimados") return "tesoreria:gastosEstimados.view";
  if (p === "/importargastosestimados") return "tesoreria:gastosEstimados.import";
  if (p === "/vencimientos") return "tesoreria:vencimientos.view";

  // ===== Info de Caja =====
  if (p === "/info/register") return "tesoreria:info.cajas.view";
  if (p === "/info/expenses") return "tesoreria:info.gastos.view";
  if (p === "/info/withdrawals") return "tesoreria:info.retiros.view";
  if (p === "/info/vouchers") return "tesoreria:info.vales.view";
  if (p === "/info/creditcard") return "tesoreria:info.cupones.view";
  if (p === "/info/salaries") return "tesoreria:info.sueldos.view";
  if (p === "/info/incomes") return "tesoreria:info.ingresos.view";
  if (p === "/info/cierrez") return "tesoreria:info.cierresZ.view";
  if (p === "/info/balanceaccount") return "tesoreria:info.ctacte.cliente.view";
  if (p === "/info/balanceaccountbranch") return "tesoreria:info.ctacte.sucursal.view";
  if (p === "/info/balanceaccountdetail") return "tesoreria:info.ctacte.detalle.view";
  if (p === "/info/detail") return "tesoreria:info.caja.detalle.view";

  // ===== Rinde / Inventario =====
  if (p === "/formulas") return "rinde:formula.view";
  if (p === "/formulas/create") return "rinde:formula.create";
  if (p === "/percent") return "rinde:percent.view";
  if (p === "/percent_update") return "rinde:percent.update";
  if (p === "/prices") return "rinde:prices.view";
  if (p === "/prices_update") return "rinde:prices.update";

  if (p === "/inventory/inventories") return "inventario:inventarios.view";
  if (p === "/inventory/create") return "inventario:inventarios.create";
  if (p === "/inventory/movements") return "inventario:movimientosInternos.view";
  if (p === "/inventory/movementsotherslist") return "inventario:movimientosOtros.view";
  if (p === "/inventory/movementsothers") return "inventario:movimientosOtros.create";

  if (p === "/inventory/performance") return "rinde:calculo.run";
  if (p === "/inventory/performancelist") return "rinde:list.view";
  if (p === "/inventory/performancelistcomparative") return "rinde:list.comparative.view";
  if (p === "/inventory/performancegeneral") return "rindeGeneral:calculo.run";
  if (p === "/inventory/performancegenerallist") return "rindeGeneral:list.view";
  if (p === "/inventory/performancelistgral") return "rindeGeneral:list.global.view";
  if (p === "/inventory/stock") return "inventario:stock.control.view";

  // ===== Mantenimiento =====
  if (p === "/equipos") return "mantenimiento:view.equipos";
  if (p === "/mantenimientos") return "mantenimiento:view.mantenimientos";
  if (p === "/ordenes-mantenimiento") return "mantenimiento:view.ordenes";
  if (p === "/mantenimiento-preventivo") return "mantenimiento:view.preventivo";

  // ===== Agenda =====
  if (p === "/agenda") return "agenda:view";

  // ===== Documentación =====
  if (p === "/documentos") return "documentacion:view";

  // ===== Proyección =====
  if (p === "/proyeccion") return "proyeccion:view";
  if (p === "/proyeccion/config") return "proyeccion:config.view";
  if (p === "/proyeccion/historico") return "proyeccion:historico.view";

  // ===== Tesorería - nuevas aplicaciones =====
  if (p === "/tesoreria/pagos-programados") return "tesoreria:pagosProgramados.view";
  if (p === "/sitfinanciera") return "tesoreria:situacionFinanciera.view";

  // ===== Inspecciones =====
  if (p === "/inspecciones") return "inspecciones:view";
  if (p === "/inspecciones/dashboard") return "inspecciones:dashboard.view";
  if (p === "/inspecciones/plantillas") return "inspecciones:plantillas.view";
  if (p === "/inspecciones/notificaciones") return "inspecciones:notificaciones.view";

  // ===== Notificaciones / Scheduler =====
  if (p === "/notification") return "notification:view";
  if (p === "/scheduler") return "scheduler:view";

  // ===== Gestión =====
  if (p === "/gestion") return "gestion:dashboard.view";
  if (p === "/gestion/kanban") return "gestion:kanban.view";
  if (p === "/gestion/tareas") return "gestion:tareas.view";
  if (p === "/gestion/proyectos") return "gestion:proyectos.view";
  if (p === "/gestion/calendario") return "gestion:calendario.view";
  if (p === "/gestion/supervisor") return "gestion:supervisor.view";
  if (p === "/gestion/reportes") return "gestion:reportes.view";

  // ===== Evaluación =====
  if (p === "/evaluacion/configuracion") return "evaluacion:configuracion.view";
  if (p === "/evaluaciones") return "evaluacion:evaluaciones.view";
  if (p === "/evaluacion/avisos") return "evaluacion:avisos.view";
  if (p === "/mis-evaluaciones") return "evaluacion:misEvaluaciones.view";
  if (p === "/evaluacion/dashboard") return "evaluacion:dashboard.view";
  if (p === "/evaluacion/reportes") return "evaluacion:reportes.view";
  if (p === "/evaluacion/metas") return "evaluacion:metas.view";
  if (p === "/evaluacion/reportes/empleado") return "evaluacion:reportes.empleado.view";
  if (p === "/evaluacion/reportes/supervisor") return "evaluacion:reportes.supervisor.view";
  if (p === "/evaluacion/reportes/mystery") return "evaluacion:reportes.mystery.view";

  // ===== Motor de Conceptos / Legajos =====
  if (p === "/motor-conceptos") return "motorConceptos:view";
  if (p === "/motor-conceptos/registros") return "motorConceptos:registros.view";
  if (p === "/motor-conceptos/documentacion/entidad") return "motorConceptos:documentacion.entidad.view";
  if (p === "/motor-conceptos/documentacion/empleados") return "motorConceptos:documentacion.empleados.view";
  if (p === "/motor-conceptos/documentacion/empresas") return "motorConceptos:documentacion.empresas.view";
  if (p === "/motor-conceptos/documentacion/sucursales") return "motorConceptos:documentacion.sucursales.view";
  if (p === "/motor-conceptos/reportes/registros") return "motorConceptos:reportes.registros.view";

  // ===== Inteligencia Comercial =====
  if (p === "/inteligencia") return "inteligencia:dashboard.view";
  if (p === "/inteligencia/eventos") return "inteligencia:eventos.view";
  if (p === "/inteligencia/snapshots") return "inteligencia:snapshots.view";
  if (p === "/inteligencia/clima") return "inteligencia:clima.view";

  // ===== Fábrica =====
  if (p === "/fabrica/stock") return "fabrica:stock.view";
  if (p === "/fabrica/transferencias") return "fabrica:transferencias.view";
  if (p === "/fabrica/transferir") return "fabrica:transferencias.create";
  if (p === "/fabrica/produccion-lotes") return "fabrica:produccion.view";

  // ===== Audio =====
  if (p === "/audio/dashboard") return "audio:dashboard.view";
  if (p === "/audio/segments") return "audio:segments.view";

  // ===== Bot =====
  if (p === "/bot/product-meta") return "bot:productos.view";
  if (p === "/bot/conversations") return "bot:conversaciones.view";
  if (p === "/bot/branch-meta") return "bot:sucursales.view";
  if (p === "/bot/benefit-meta") return "bot:beneficios.view";
  if (p === "/bot/event-meta") return "bot:eventos.view";

  // ===== Fidelización =====
  if (p === "/fidelizacion/dashboard") return "fidelizacion:dashboard.view";
  if (p === "/fidelizacion/comercios") return "fidelizacion:comercios.view";
  if (p === "/fidelizacion/campanias") return "fidelizacion:campanias.view";
  if (p === "/fidelizacion/premios-clientes") return "fidelizacion:premiosClientes.view";
  if (p === "/fidelizacion/cupones") return "fidelizacion:cupones.view";
  if (p === "/fidelizacion/canjes-cupones") return "fidelizacion:canjesCupones.view";
  if (p === "/fidelizacion/clientes") return "fidelizacion:clientes.view";
  if (p === "/fidelizacion/validar-cupon") return "fidelizacion:validarCupon.view";
  if (p === "/fidelizacion/puntos-comercio") return "fidelizacion:puntosComercio.view";
  if (p === "/fidelizacion/premios-comercios") return "fidelizacion:premiosComercios.view";
  if (p === "/fidelizacion/canjes-comercios") return "fidelizacion:canjesComercios.view";
  if (p === "/fidelizacion/alertas-fraude") return "fidelizacion:alertasFraude.view";

  return null;
}


/** --- Lista canónica de rutas conocidas --- */
const KNOWN_PATHS = [
  // Config
  "/users", "/users/new", "/banks", "/empresas", "/frigorificos",
  "/librosiva", "/librosiva/new", "/compraproyectada", "/ivaproyeccion",
  "/categorias-animales", "/tarjetas-comunes", "/tarjeta-planes",
  "/formas-pago-tesoreria", "/imputaciones-contables", "/marcas-tarjeta",
  "/tipos-tarjeta", "/tipos-comprobantes", "/ptos-venta", "/proveedores",
  "/proyectos", "/periodoliquidacion", "/sync", "/registros",

  // Gestión de Medias
  "/registrohacienda",
  "/sells", "/sells/new",
  "/products", "/products/new", "/products_update", "/products_update_tropa", "/products/verificar-tropa",
  "/branches", "/customers", "/customers/new",
  "/waypays", "/waypays/new",
  "/accounts/new", "/accounts",
  "/stock", "/stock/central",
  "/orders/new", "/orders", "/orders/productsfromexcel",
  "/receipts/new", "/receipts", "/receipts/products",

  // Estadísticas / Ventas
  "/precioshistoricos", "/sells/totalcomparativo", "/sells/comparativorangos",
  "/sells/graficoventas", "/sells/total", "/sells/customers", "/sells/deleted",
  "/sells/discount", "/sells/articles", "/sells/user", "/sells/kg_branch",
  "/sells/quantity", "/inventory/stock",

  // RRHH / Asistencia
  "/dashboardasistencias", "/asistencias/conceptos", "/asistencias/eventos",
  "/asistencias/listarvacaciones", "/asistencias/planificacion",
  "/asistencias/horarios", "/asistencias/asignarempleado", "/asistencias/huellanavegador",
  "/asistencias", "/jornadasasistencias", "/parametrosasistencias",

  // Tesorería
  "/tesoreria/cajas/apertura", "/tesoreria/movimientos-caja-tesoreria", "/tesoreria/retirossucursales",
  "/tesoreria/movimientos-banco-tesoreria", "/tesoreria/movimientos-banco-tesoreria-excel",
  "/tesoreria/movimientos-tarjetas-tesoreria", "/tesoreria/movimientos-echeq-tesoreria",
  "/gastosestimados", "/importargastosestimados", "/vencimientos",

  // Info de Caja
  "/info/register", "/info/expenses", "/info/withdrawals", "/info/vouchers",
  "/info/creditcard", "/info/salaries", "/info/incomes", "/info/cierrez",
  "/info/balanceaccount", "/info/balanceaccountbranch", "/info/balanceaccountdetail",
  "/info/detail",

  // Rinde / Inventario
  "/formulas", "/formulas/create", "/percent", "/percent_update",
  "/prices", "/prices_update",
  "/inventory/inventories", "/inventory/create", "/inventory/movements",
  "/inventory/movementsotherslist", "/inventory/movementsothers",
  "/inventory/performance", "/inventory/performancelist", "/inventory/performancelistcomparative",
  "/inventory/performancegeneral", "/inventory/performancegenerallist", "/inventory/performancelistgral",
  "/inventory/stock",

  // Mantenimiento
  "/equipos", "/mantenimientos", "/ordenes-mantenimiento", "/mantenimiento-preventivo",

  // Agenda
  "/agenda",

  // Documentación
  "/documentos",

  // Proyección
  "/proyeccion",
  "/proyeccion/config",
  "/proyeccion/historico",

  // Tesorería - nuevas aplicaciones
  "/tesoreria/pagos-programados",
  "/sitfinanciera",

  // Inspecciones
  "/inspecciones",
  "/inspecciones/dashboard",
  "/inspecciones/plantillas",
  "/inspecciones/notificaciones",

  // Notificaciones / Scheduler
  "/notification",
  "/scheduler",

  // Gestión
  "/gestion",
  "/gestion/kanban",
  "/gestion/tareas",
  "/gestion/proyectos",
  "/gestion/calendario",
  "/gestion/supervisor",
  "/gestion/reportes",

  // Evaluación
  "/evaluacion/configuracion",
  "/evaluaciones",
  "/evaluacion/avisos",
  "/mis-evaluaciones",
  "/evaluacion/dashboard",
  "/evaluacion/reportes",
  "/evaluacion/metas",
  "/evaluacion/reportes/empleado",
  "/evaluacion/reportes/supervisor",
  "/evaluacion/reportes/mystery",

  // Motor de Conceptos / Legajos
  "/motor-conceptos",
  "/motor-conceptos/registros",
  "/motor-conceptos/documentacion/entidad",
  "/motor-conceptos/documentacion/empleados",
  "/motor-conceptos/documentacion/empresas",
  "/motor-conceptos/documentacion/sucursales",
  "/motor-conceptos/reportes/registros",

  // Inteligencia Comercial
  "/inteligencia",
  "/inteligencia/eventos",
  "/inteligencia/snapshots",
  "/inteligencia/clima",

  // Fábrica
  "/fabrica/stock",
  "/fabrica/transferencias",
  "/fabrica/transferir",
  "/fabrica/produccion-lotes",

  // Audio
  "/audio/dashboard",
  "/audio/segments",

  // Bot
  "/bot/product-meta",
  "/bot/conversations",
  "/bot/branch-meta",
  "/bot/benefit-meta",
  "/bot/event-meta",

  // Fidelización
  "/fidelizacion/dashboard",
  "/fidelizacion/comercios",
  "/fidelizacion/campanias",
  "/fidelizacion/premios-clientes",
  "/fidelizacion/cupones",
  "/fidelizacion/canjes-cupones",
  "/fidelizacion/clientes",
  "/fidelizacion/validar-cupon",
  "/fidelizacion/puntos-comercio",
  "/fidelizacion/premios-comercios",
  "/fidelizacion/canjes-comercios",
  "/fidelizacion/alertas-fraude",
];

/** --- ETIQUETAS EN ESPAÑOL (personalizables) --- */
const LABELS_ES = {
  // Config
  "/users": "Usuarios",
  "/users/new": "Crear usuario",
  "/banks": "Bancos",
  "/empresas": "Empresas",
  "/frigorificos": "Frigoríficos",
  "/librosiva": "Libro IVA",
  "/librosiva/new": "Nuevo libro IVA",
  "/compraproyectada": "Compra proyectada",
  "/ivaproyeccion": "Proyección de IVA",
  "/categorias-animales": "Categorías de animales",
  "/tarjetas-comunes": "Tarjetas comunes",
  "/tarjeta-planes": "Planes de tarjeta",
  "/formas-pago-tesoreria": "Formas de pago (Tesorería)",
  "/imputaciones-contables": "Imputaciones contables",
  "/marcas-tarjeta": "Marcas de tarjeta",
  "/tipos-tarjeta": "Tipos de tarjeta",
  "/tipos-comprobantes": "Tipos de comprobantes",
  "/ptos-venta": "Puntos de venta",
  "/proveedores": "Proveedores",
  "/proyectos": "Proyectos",
  "/periodoliquidacion": "Períodos de liquidación",
  "/sync": "Sincronización",
  "/registros": "Registros",

  // Gestión de Medias
  "/registrohacienda": "Registro de Hacienda",
  "/sells": "Ventas",
  "/sells/new": "Nueva venta",
  "/products": "Productos",
  "/products/new": "Crear producto",
  "/products_update": "Actualizar productos",
  "/products_update_tropa": "Actualizar por tropa",
  "/products/verificar-tropa": "Verificar por tropa",
  "/branches": "Sucursales",
  "/customers": "Clientes",
  "/customers/new": "Crear cliente",
  "/waypays": "Formas de pago",
  "/waypays/new": "Crear forma de pago",
  "/accounts/new": "Nueva cuenta corriente",
  "/accounts": "Cuentas corrientes",
  "/stock": "Stock sucursal",
  "/stock/central": "Stock central",
  "/orders/new": "Nueva orden",
  "/orders": "Órdenes",
  "/orders/productsfromexcel": "Importar productos (Excel)",
  "/receipts/new": "Nuevo ingreso",
  "/receipts": "Ingresos",
  "/receipts/products": "Productos ingresados",

  // Estadísticas / Ventas
  "/precioshistoricos": "Precios históricos",
  "/sells/totalcomparativo": "Ventas: total comparativo",
  "/sells/comparativorangos": "Ventas: comparativo por rangos",
  "/sells/graficoventas": "Ventas: gráfico",
  "/sells/total": "Ventas: total",
  "/sells/customers": "Ventas por cliente",
  "/sells/deleted": "Ventas eliminadas",
  "/sells/discount": "Descuentos",
  "/sells/articles": "Ventas por artículo",
  "/sells/user": "Ventas por usuario",
  "/sells/kg_branch": "Kg por sucursal",
  "/sells/quantity": "Cantidad de tickets",
  "/inventory/stock": "Inventario / Stock",

  // RRHH / Asistencia
  "/dashboardasistencias": "Dashboard Asistencias",
  "/asistencias/conceptos": "Conceptos de asistencia",
  "/asistencias/eventos": "Eventos de asistencia",
  "/asistencias/listarvacaciones": "Vacaciones",
  "/asistencias/planificacion": "Planificación",
  "/asistencias/horarios": "Horarios",
  "/asistencias/asignarempleado": "Asignar empleado",
  "/asistencias/huellanavegador": "Huella en navegador",
  "/asistencias": "Asistencias",
  "/jornadasasistencias": "Jornadas",
  "/parametrosasistencias": "Parámetros de asistencia",

  // Tesorería
  "/tesoreria/cajas/apertura": "Apertura de caja",
  "/tesoreria/movimientos-caja-tesoreria": "Movimientos de caja",
  "/tesoreria/retirossucursales": "Retiros sucursales",
  "/tesoreria/movimientos-banco-tesoreria": "Movimientos bancarios",
  "/tesoreria/movimientos-banco-tesoreria-excel": "Importar banco (Excel)",
  "/tesoreria/movimientos-tarjetas-tesoreria": "Movimientos tarjetas",
  "/tesoreria/movimientos-echeq-tesoreria": "Movimientos eCheq",
  "/gastosestimados": "Gastos estimados",
  "/importargastosestimados": "Importar gastos estimados",
  "/vencimientos": "Vencimientos",

  // Info de Caja
  "/info/register": "Info: Caja (Registros)",
  "/info/expenses": "Info: Gastos",
  "/info/withdrawals": "Info: Retiros",
  "/info/vouchers": "Info: Vales",
  "/info/creditcard": "Info: Cupones Tarjeta",
  "/info/salaries": "Info: Sueldos",
  "/info/incomes": "Info: Ingresos",
  "/info/cierrez": "Info: Cierres Z",
  "/info/balanceaccount": "Info: CtaCte Clientes",
  "/info/balanceaccountbranch": "Info: CtaCte Sucursales",
  "/info/balanceaccountdetail": "Info: Detalle CtaCte",
  "/info/detail": "Info: Detalle de caja",

  // Rinde / Inventario
  "/formulas": "Fórmulas",
  "/formulas/create": "Crear fórmula",
  "/percent": "Porcentajes",
  "/percent_update": "Actualizar porcentajes",
  "/prices": "Precios",
  "/prices_update": "Actualizar precios",
  "/inventory/inventories": "Inventarios",
  "/inventory/create": "Crear inventario",
  "/inventory/movements": "Movimientos internos",
  "/inventory/movementsotherslist": "Movimientos otros (lista)",
  "/inventory/movementsothers": "Crear movimientos otros",
  "/inventory/performance": "Rinde: cálculo",
  "/inventory/performancelist": "Rinde: lista",
  "/inventory/performancelistcomparative": "Rinde: lista comparativa",
  "/inventory/performancegeneral": "Rinde general: cálculo",
  "/inventory/performancegenerallist": "Rinde general: lista",
  "/inventory/performancelistgral": "Rinde general: global",
  "/inventory/stock": "Control de stock",

  // Mantenimiento
  "/equipos": "Equipos",
  "/mantenimientos": "Mantenimientos",
  "/ordenes-mantenimiento": "Órdenes de mantenimiento",
  "/mantenimiento-preventivo": "Mantenimiento preventivo",

  // Agenda
  "/agenda": "Agenda",

  // Documentación
  "/documentos": "Documentación",

  // Proyección
  "/proyeccion": "Proyección",
  "/proyeccion/config": "Configuración de proyección",
  "/proyeccion/historico": "Histórico de proyecciones",

  // Tesorería
  "/tesoreria/pagos-programados": "Pagos programados",
  "/sitfinanciera": "Situación financiera",

  // Inspecciones
  "/inspecciones": "Inspecciones",
  "/inspecciones/dashboard": "Dashboard de inspecciones",
  "/inspecciones/plantillas": "Plantillas de inspección",
  "/inspecciones/notificaciones": "Notificaciones de inspecciones",

  // Notificaciones / Scheduler
  "/notification": "Notificaciones",
  "/scheduler": "Tareas programadas",

  // Gestión
  "/gestion": "Gestión - Dashboard",
  "/gestion/kanban": "Gestión - Kanban",
  "/gestion/tareas": "Gestión - Tareas",
  "/gestion/proyectos": "Gestión - Proyectos",
  "/gestion/calendario": "Gestión - Calendario",
  "/gestion/supervisor": "Gestión - Supervisor",
  "/gestion/reportes": "Gestión - Reportes",

  // Evaluación
  "/evaluacion/configuracion": "Evaluación - Configuración",
  "/evaluaciones": "Evaluaciones",
  "/evaluacion/avisos": "Evaluación - Avisos",
  "/mis-evaluaciones": "Mis evaluaciones",
  "/evaluacion/dashboard": "Evaluación - Dashboard",
  "/evaluacion/reportes": "Evaluación - Reportes",
  "/evaluacion/metas": "Evaluación - Metas",
  "/evaluacion/reportes/empleado": "Evaluación - Reporte por empleado",
  "/evaluacion/reportes/supervisor": "Evaluación - Reporte supervisor",
  "/evaluacion/reportes/mystery": "Evaluación - Reporte Mystery",

  // Motor de Conceptos / Legajos
  "/motor-conceptos": "Motor de Conceptos",
  "/motor-conceptos/registros": "Motor de Conceptos - Registros",
  "/motor-conceptos/documentacion/entidad": "Documentación de entidades",
  "/motor-conceptos/documentacion/empleados": "Legajos - Empleados",
  "/motor-conceptos/documentacion/empresas": "Legajos - Empresas",
  "/motor-conceptos/documentacion/sucursales": "Legajos - Sucursales",
  "/motor-conceptos/reportes/registros": "Motor de Conceptos - Reporte de registros",

  // Inteligencia Comercial
  "/inteligencia": "Inteligencia Comercial",
  "/inteligencia/eventos": "Inteligencia Comercial - Eventos",
  "/inteligencia/snapshots": "Inteligencia Comercial - Snapshots",
  "/inteligencia/clima": "Inteligencia Comercial - Clima",

  // Fábrica
  "/fabrica/stock": "Fábrica - Stock",
  "/fabrica/transferencias": "Fábrica - Transferencias",
  "/fabrica/transferir": "Fábrica - Nueva transferencia",
  "/fabrica/produccion-lotes": "Fábrica - Producción",

  // Audio
  "/audio/dashboard": "Audio - Dashboard",
  "/audio/segments": "Audio - Segmentos",

  // Bot
  "/bot/product-meta": "Bot - Productos",
  "/bot/conversations": "Bot - Conversaciones",
  "/bot/branch-meta": "Bot - Sucursales",
  "/bot/benefit-meta": "Bot - Beneficios",
  "/bot/event-meta": "Bot - Eventos",

  // Fidelización
  "/fidelizacion/dashboard": "Fidelización - Dashboard",
  "/fidelizacion/comercios": "Fidelización - Comercios",
  "/fidelizacion/campanias": "Fidelización - Campañas",
  "/fidelizacion/premios-clientes": "Fidelización - Premios clientes",
  "/fidelizacion/cupones": "Fidelización - Cupones",
  "/fidelizacion/canjes-cupones": "Fidelización - Canjes de cupones",
  "/fidelizacion/clientes": "Fidelización - Clientes",
  "/fidelizacion/validar-cupon": "Fidelización - Validar cupón",
  "/fidelizacion/puntos-comercio": "Fidelización - Puntos comercio",
  "/fidelizacion/premios-comercios": "Fidelización - Premios comercios",
  "/fidelizacion/canjes-comercios": "Fidelización - Canjes comercios",
  "/fidelizacion/alertas-fraude": "Fidelización - Alertas de fraude",
};

/** --- Helpers (etiquetado) --- */
function labelize(path) {
  if (!path || path === "/") return "Inicio";
  const clean = path.replace(/^\//, "");
  return clean
    .split("/")
    .map(s => s.replace(/[-_]/g, " "))
    .map(s => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" / ");
}

function getLabel(path) {
  return LABELS_ES[path] || labelize(path);
}

function buildCatalogFromPaths(paths = KNOWN_PATHS) {
  return paths.map(p => ({
    label: getLabel(p),       // <-- usa español si existe
    path: p,
    keywords: [],
  }));
}

/** --- Auth / filtros --- */
async function getUserPerms(userId) {
  if (!userId) return [];
  const u = await Usuario.findByPk(userId, { attributes: ["id", "permissions"] });
  if (!u) return [];
  const raw = u.permissions;
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string") {
    try { return JSON.parse(raw); } catch { return []; }
  }
  return [];
}

/** Endurecido: si NO hay mapeo en inferPerm => OCULTA */
function filterByPerms(catalog, permSet) {
  return catalog.filter((link) => {
    const need = inferPerm(link.path);
    if (!need) {
      console.log(`[nav] OCULTA (sin mapeo inferPerm) ⇒ ${link.path}`);
      return false;
    }
    const ok = permSet.has(need);
    if (!ok) {
      console.log(`[nav] OCULTA por permiso faltante "${need}" ⇒ ${link.path}`);
    }
    return ok;
  });
}

/** --- Endpoints --- */

// GET /nav/links?roleId=1&userId=123
export const getNavLinks = async (req, res, next) => {
  try {
    const roleId = req.query.roleId ? Number(req.query.roleId) : undefined;
    const userId = req.query.userId ? Number(req.query.userId) : undefined;

    console.log(`[GET /nav/links] roleId=${roleId} userId=${userId}`);

    const userPerms = await getUserPerms(userId);
    console.log(`[GET /nav/links] user perms (${userPerms.length})`);

    // const catalog = buildCatalogFromPaths(KNOWN_PATHS);
    // const links = filterByPerms(catalog, new Set(userPerms))
    //   .sort((a, b) => a.label.localeCompare(b.label, "es"));

    const catalog =
      buildCatalogFromPaths(
        KNOWN_PATHS
      );


    const links =
      (
        roleId === 1
          ? catalog
          : filterByPerms(
            catalog,
            new Set(userPerms)
          )
      )
        .sort(
          (a, b) =>
            a.label.localeCompare(
              b.label,
              "es"
            )
        );

    console.log(`[GET /nav/links] return ${links.length} links. sample=`, links.slice(0, 5).map(l => `${l.label} (${l.path})`));
    return res.status(200).json({ links });
  } catch (err) {
    console.error("[GET /nav/links] ERROR:", err);
    return next(err);
  }
};

// GET /nav/search?q=ventas&roleId=1&userId=123
export const searchNav = async (req, res, next) => {
  try {
    const q = (req.query.q || "").toString().toLowerCase().trim();
    const roleId = req.query.roleId ? Number(req.query.roleId) : undefined;
    const userId = req.query.userId ? Number(req.query.userId) : undefined;

    console.log(`[GET /nav/search] q="${q}" roleId=${roleId} userId=${userId}`);

    // const userPerms = await getUserPerms(userId);
    // const base = filterByPerms(buildCatalogFromPaths(KNOWN_PATHS), new Set(userPerms));

    const userPerms = await getUserPerms(userId);

    const catalog =
      buildCatalogFromPaths(
        KNOWN_PATHS
      );

    const base =
      roleId === 1
        ? catalog
        : filterByPerms(
          catalog,
          new Set(userPerms)
        );

    const byCatalog = q
      ? base.filter((l) =>
        (l.label && l.label.toLowerCase().includes(q)) ||
        (l.path && l.path.toLowerCase().includes(q)) ||
        (Array.isArray(l.keywords) && l.keywords.some(k => k.toLowerCase().includes(q)))
      )
      : base.slice(0, 50);

    return res.status(200).json({
      query: q,
      results: { catalog: byCatalog, shortcuts: [] },
    });
  } catch (err) {
    console.error("[GET /nav/search] ERROR:", err);
    return next(err);
  }
};

// GET /nav/debug-mapping (diagnóstico)
export const debugMapping = (req, res) => {
  const report = KNOWN_PATHS.map(p => ({ path: p, perm: inferPerm(p), label: getLabel(p) }));
  const missing = report.filter(r => !r.perm).map(r => r.path);
  console.log("[/nav/debug-mapping] missing inferPerm =>", missing);
  return res.json({ total: report.length, missing: missing.length, report });
};
