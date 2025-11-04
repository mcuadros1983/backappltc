// controllers/nav/navController.js
// =====================================================
// Catálogo de navegación + Filtro por PERMISOS del usuario.
// - Si un link tiene "perm" inferido y el usuario NO lo tiene => se oculta.
// - Si NO se puede inferir permiso, hacemos fallback opcional a "roles" (legacy).
// - Logs detallados para depurar.
// =====================================================

import Usuario from "../../models/auth/usuarioModel.js";

/**
 * Catálogo base (podés mantener roles como fallback legacy).
 * NO repetí todo el catálogo para no alargar; podés conservar tu NAV_LINKS actual.
 * Acá pongo una muestra y vos dejás el resto como lo tenías.
 */
const NAV_LINKS = [
  // --- Core ---
  { label: "Dashboard", path: "/dashboard", keywords: ["inicio", "home", "panel"] },
  { label: "Agenda", path: "/agenda", keywords: ["calendar", "turnos"], roles: [1] },
  { label: "Registros", path: "/registros", keywords: ["logs", "auditoría"], roles: [1] },
  { label: "Precios Históricos", path: "/precioshistoricos", keywords: ["historial", "precios"], roles: [1] },

  // --- Gestión de Medias (muestras; conservá el resto igual que tu archivo original) ---
  { label: "Registro Hacienda", path: "/registrohacienda", keywords: ["hacienda", "faena"], roles: [1, 2, 3] },
  { label: "Productos", path: "/products", keywords: ["artículos", "mercadería", "productos"], roles: [1, 2] },
  { label: "Crear Productos", path: "/products/new", keywords: ["productos", "crear"], roles: [1, 2] },
  { label: "Actualizar Productos", path: "/products_update", keywords: ["actualizar", "productos"], roles: [1, 2] },
  { label: "Actualizar por Tropa", path: "/products_update_tropa", keywords: ["tropa", "actualizar"], roles: [1, 2] },
  { label: "Verificar por Tropa", path: "/products/verificar-tropa", keywords: ["verificar", "tropa"], roles: [1, 2] },

  // ... 🔽 pega aquí TODO tu NAV_LINKS original tal cual lo tenías (no lo pierdas)
];

/**
 * Mapa rápido ruta → permiso. Para no escribir 100 cases, uso reglas por prefijo.
 * Si necesitás algo ultra específico, añadilo al switch.
 */
function inferPerm(path = "") {
  // Normalizar
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

  // ===== Agenda / Permisos módulos =====
  if (p === "/agenda") return "agenda:view";

  // Si no matcheó nada, devolveme null → se usará fallback a roles (si los hay).
  return null;
}

/** Filtro por permisos con fallback opcional a roles */
function hasAccess(link, userPermsSet, roleId) {
  const required = inferPerm(link.path);
  if (required) {
    const ok = userPermsSet.has(required);
    if (!ok) {
      // Log agresivo para ver por qué se oculta
      console.log(`[nav.hasAccess] NO PERM ${required} ⇒ oculta: ${link.label} (${link.path})`);
    }
    return ok;
  }
  // Si no hay permiso mapeado, usar fallback legacy por roles (si el link lo trae)
  if (Array.isArray(link.roles) && link.roles.length > 0) {
    const ok = roleId ? link.roles.includes(Number(roleId)) : true;
    if (!ok) {
      console.log(`[nav.hasAccess] FALLBACK roles no incluye rol_id=${roleId} ⇒ oculta: ${link.label}`);
    }
    return ok;
  }
  // Sin perm y sin roles → mostrar (o podés decidir ocultar)
  console.log(`[nav.hasAccess] SIN perm ni roles ⇒ muestra por defecto: ${link.label} (${link.path})`);
  return true;
}

/** Carga permisos del usuario (array) */
async function getUserPerms(userId) {
  if (!userId) return [];
  const u = await Usuario.findByPk(userId, { attributes: ["id", "permissions"] });
  const perms = Array.isArray(u?.permissions) ? u.permissions : [];
  return perms;
}

/** Aplica filtro por permisos/roles + logs */
async function filterByUser(links, { roleId, userId }) {
  const perms = await getUserPerms(userId);
  const permSet = new Set(perms);

  console.log(`[nav.filterByUser] roleId=${roleId} userId=${userId} perms=${perms.length}`);
  // Contar mapeos de permisos
  let withPerm = 0;
  let withoutPerm = 0;

  const filtered = links.filter((l) => {
    const need = inferPerm(l.path);
    if (need) withPerm++; else withoutPerm++;
    return hasAccess(l, permSet, roleId);
  });

  console.log(`[nav.filterByUser] links in=${links.length} | withPerm=${withPerm} | withoutPerm=${withoutPerm} | out=${filtered.length}`);
  return filtered;
}

// GET /nav/links?roleId=1&userId=123
export const getNavLinks = async (req, res, next) => {
  try {
    const roleId = req.query.roleId ? Number(req.query.roleId) : undefined;
    const userId = req.query.userId ? Number(req.query.userId) : undefined;

    console.log(`[GET /nav/links] q.roleId=${roleId} q.userId=${userId}`);

    const filtered = await filterByUser(NAV_LINKS, { roleId, userId });

    // Logging de muestra de 5
    console.log(`[GET /nav/links] returning ${filtered.length} links. sample=`, filtered.slice(0, 5).map(x => x.path));

    return res.status(200).json({ links: filtered });
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

    // Primero, base filtrada por permisos del usuario
    const base = await filterByUser(NAV_LINKS, { roleId, userId });

    // Buscar en el catálogo filtrado
    const byCatalog = q
      ? base.filter((l) => {
          const hay =
            (l.label && l.label.toLowerCase().includes(q)) ||
            (l.path && l.path.toLowerCase().includes(q)) ||
            (Array.isArray(l.keywords) && l.keywords.some((k) => k.toLowerCase().includes(q)));
          return !!hay;
        })
      : base.slice(0, 20);

    // Shortcuts personales (si los usás) — también podrías filtrarlos por permiso si guardás "path" y aplicás inferPerm
    let shortcuts = [];
    if (userId) {
      const u = await Usuario.findByPk(userId, { attributes: ["id", "shortcuts"] });
      if (u && Array.isArray(u.shortcuts)) {
        const rawShort = q
          ? u.shortcuts.filter(
              (s) =>
                (s.label && s.label.toLowerCase().includes(q)) ||
                (s.path && s.path.toLowerCase().includes(q))
            )
          : u.shortcuts.slice(0, 20);

        // Filtrar shortcuts por permisos también:
        const permSet = new Set(await getUserPerms(userId));
        shortcuts = rawShort.filter(s => hasAccess({ path: s.path, label: s.label }, permSet, roleId));
      }
    }

    console.log(`[GET /nav/search] results: catalog=${byCatalog.length} shortcuts=${shortcuts.length}`);
    return res.status(200).json({
      query: q,
      results: { catalog: byCatalog, shortcuts },
    });
  } catch (err) {
    console.error("[GET /nav/search] ERROR:", err);
    return next(err);
  }
};
