import { Op } from "sequelize";
import GastoEstimado from "../../models/tesoreria/gastoestimado.js";
import GastoEstimadoInstancia from "../../models/tesoreria/gastoestimadoinstancia.js";
import GastoEstimadoPago from "../../models/tesoreria/gastoestimadopago.js";
import XLSX from "xlsx";
import { sequelize } from "../../config/database.js";
import Proveedor from "../../models/comun/proveedor.js";           // Ajustá la ruta real del modelo
import CategoriaEgreso from "../../models/tesoreria/categoriaEgreso.js"; // Ajustá la ruta real del modelo
import ExcelJS from "exceljs"; // NUEVO: para generar XLSX con validaciones


// ---------- helpers ----------

function stripAccents(str = "") {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
function normName(s) {
  return stripAccents(String(s || "").trim().toLowerCase().replace(/\s+/g, " "));
}

function daysInMonth(year, month /* 1..12 */) {
  return new Date(year, month, 0).getDate();
}
function clampDay(day, year, month) {
  const mdays = daysInMonth(year, month);
  if (!day) return mdays; // si no hay default, uso fin de mes
  return Math.max(1, Math.min(day, mdays));
}
function periodStr(y, m) {
  const mm = String(m).padStart(2, "0");
  return `${y}-${mm}`;
}
function* iteratePeriods(desde /* 'YYYY-MM' */, hasta /* 'YYYY-MM' */) {
  const [y1, m1] = desde.split("-").map(n => parseInt(n, 10));
  const [y2, m2] = hasta.split("-").map(n => parseInt(n, 10));
  let y = y1, m = m1;
  while (y < y2 || (y === y2 && m <= m2)) {
    yield { y, m };
    m++;
    if (m > 12) { m = 1; y++; }
  }
}
async function recomputarEstado(instancia) {
  const base = Number((instancia.monto_real ?? instancia.monto_estimado) ?? 0);
  const pagado = Number(instancia.monto_pagado || 0);

  let estado = "pendiente";
  if (pagado > 0 && pagado < base) estado = "parcial";
  if (pagado >= base && base > 0) estado = "pagado";

  const hoy = new Date().toISOString().slice(0, 10);
  if (estado !== "pagado" && instancia.fecha_vencimiento && instancia.fecha_vencimiento < hoy) {
    estado = "vencido";
  }
  instancia.estado = estado;
  await instancia.save();
  return instancia;
}

// ---------- Plantillas ----------
export async function crearPlantilla(req, res) {
  try {
    const body = req.body || {};
    const row = await GastoEstimado.create(body);

    // AUTOGENERAR instancia del período actual
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth() + 1;
    const periodo = periodStr(y, m);
    const dia = clampDay(row.dia_vencimiento_default || 0, y, m);
    const fecha_vencimiento = new Date(y, m - 1, dia).toISOString().slice(0, 10);

    await GastoEstimadoInstancia.findOrCreate({
      where: { gastoestimado_id: row.id, periodo },
      defaults: {
        gastoestimado_id: row.id,
        empresa_id: row.empresa_id,
        proveedor_id: row.proveedor_id,
        categoriaegreso_id: row.categoriaegreso_id,
        sucursal_id: row.sucursal_id,
        tipocomprobante_id: row.tipocomprobante_id,
        formapago_id: row.formapago_id ?? null,

        descripcion: row.descripcion,
        periodo,
        fecha_vencimiento,
        monto_estimado: row.monto_estimado_default || 0,
        monto_real: null,
        monto_pagado: 0,
        estado: "pendiente",
        created_from: "generado",
        observaciones: row.observaciones || null,
      },
    });

    res.json(row);
  } catch (e) {
    console.error("crearPlantilla", e);
    res.status(500).json({ error: "Error creando la plantilla" });
  }
}

export async function listarPlantillas(req, res) {
  try {
    const { empresa_id, activo, proveedor_id, categoriaegreso_id, sucursal_id, q } = req.query;
    const where = {};
    if (empresa_id) where.empresa_id = empresa_id;
    if (activo !== undefined && activo !== "") where.activo = (activo === "true");
    if (proveedor_id) where.proveedor_id = proveedor_id;
    if (categoriaegreso_id) where.categoriaegreso_id = categoriaegreso_id;
    if (sucursal_id) where.sucursal_id = sucursal_id;
    if (q) where.descripcion = { [Op.iLike]: `%${q}%` };

    const rows = await GastoEstimado.findAll({ where, order: [["descripcion", "ASC"]] });
    res.json(rows);
  } catch (e) {
    console.error("listarPlantillas", e);
    res.status(500).json({ error: "Error listando plantillas" });
  }
}

export async function obtenerPlantilla(req, res) {
  try {
    console.log("instancia", req.params.id)
    const row = await GastoEstimado.findByPk(req.params.id);
    if (!row) return res.status(404).json({ error: "No encontrada" });
    res.json(row);
  } catch (e) {
    console.error("obtenerPlantilla", e);
    res.status(500).json({ error: "Error obteniendo plantilla" });
  }
}

export async function actualizarPlantilla(req, res) {
  try {
    const row = await GastoEstimado.findByPk(req.params.id);
    if (!row) return res.status(404).json({ error: "No encontrada" });

    const wasActive = row.activo !== false;
    await row.update(req.body || {});

    // Si se desactiva la plantilla ahora, anulamos instancias futuras no pagadas
    if (wasActive && row.activo === false) {
      const hoy = new Date().toISOString().slice(0, 10);
      await GastoEstimadoInstancia.update(
        { anulado: true, estado: "anulado" },
        {
          where: {
            gastoestimado_id: row.id,
            estado: { [Op.ne]: "pagado" },
            fecha_vencimiento: { [Op.gte]: hoy },
          },
        }
      );
    }

    res.json(row);
  } catch (e) {
    console.error("actualizarPlantilla", e);
    res.status(500).json({ error: "Error actualizando plantilla" });
  }
}


export async function eliminarPlantilla(req, res) {
  try {
    const row = await GastoEstimado.findByPk(req.params.id);
    if (!row) return res.status(404).json({ error: "No encontrada" });
    await row.update({ activo: false });
    res.json({ ok: true });
  } catch (e) {
    console.error("eliminarPlantilla", e);
    res.status(500).json({ error: "Error eliminando plantilla" });
  }
}

// ---------- Generación de Instancias (manual por rango YYYY-MM) ----------
export async function generarInstancias(req, res) {
  try {
    const { id } = req.params;
    const { desde, hasta } = req.body || {}; // 'YYYY-MM'
    if (!desde || !hasta) return res.status(400).json({ error: "desde/hasta (YYYY-MM) requeridos" });

    const plant = await GastoEstimado.findByPk(id);
    if (!plant) return res.status(404).json({ error: "Plantilla no encontrada" });

    const out = [];
    for (const { y, m } of iteratePeriods(desde, hasta)) {
      const periodo = periodStr(y, m);
      const dia = clampDay(plant.dia_vencimiento_default || 0, y, m);
      const fv = new Date(y, m - 1, dia).toISOString().slice(0, 10);

      const [inst] = await GastoEstimadoInstancia.findOrCreate({
        where: { gastoestimado_id: plant.id, periodo },
        defaults: {
          gastoestimado_id: plant.id,
          empresa_id: plant.empresa_id,
          proveedor_id: plant.proveedor_id,
          categoriaegreso_id: plant.categoriaegreso_id,
          sucursal_id: plant.sucursal_id,
          tipocomprobante_id: plant.tipocomprobante_id,
          formapago_id: plant.formapago_id ?? null,

          descripcion: plant.descripcion,
          periodo,
          fecha_vencimiento: fv,
          monto_estimado: plant.monto_estimado_default || 0,
          created_from: "generado",
        },
      });
      out.push(inst);
    }
    res.json(out);
  } catch (e) {
    console.error("generarInstancias", e);
    res.status(500).json({ error: "Error generando instancias" });
  }
}

// ---------- Instancias ----------
export async function listarInstancias(req, res) {
  try {
    const {
      empresa_id,
      proveedor_id,
      categoriaegreso_id,
      sucursal_id,
      estado,
      desde, // 'YYYY-MM'
      hasta, // 'YYYY-MM'
      vencimiento_desde, // 'YYYY-MM-DD'
      vencimiento_hasta, // 'YYYY-MM-DD'
      q,
    } = req.query;

    const where = {};
    if (empresa_id) where.empresa_id = empresa_id;
    if (proveedor_id) where.proveedor_id = proveedor_id;
    if (categoriaegreso_id) where.categoriaegreso_id = categoriaegreso_id;
    if (sucursal_id) where.sucursal_id = sucursal_id;
    if (estado) where.estado = estado;
    if (desde || hasta) {
      where.periodo = {};
      if (desde) where.periodo[Op.gte] = desde;
      if (hasta) where.periodo[Op.lte] = hasta;
    }
    if (vencimiento_desde || vencimiento_hasta) {
      where.fecha_vencimiento = {};
      if (vencimiento_desde) where.fecha_vencimiento[Op.gte] = vencimiento_desde;
      if (vencimiento_hasta) where.fecha_vencimiento[Op.lte] = vencimiento_hasta;
    }

    let rows = await GastoEstimadoInstancia.findAll({
      where,
      order: [["fecha_vencimiento", "ASC"], ["id", "ASC"]],
    });

    if (q) {
      const plants = await GastoEstimado.findAll({
        attributes: ["id"],
        where: { descripcion: { [Op.iLike]: `%${q}%` } },
      });
      const ids = new Set(plants.map(p => p.id));
      rows = rows.filter(r => ids.has(r.gastoestimado_id));
    }

    const hoy = new Date().toISOString().slice(0, 10);
    rows = rows.map(r => {
      if (r.estado !== "pagado" && r.fecha_vencimiento < hoy) {
        const clone = r.toJSON();
        clone.estado = "vencido";
        return clone;
      }
      return r;
    });

    res.json(rows);
  } catch (e) {
    console.error("listarInstancias", e);
    res.status(500).json({ error: "Error listando instancias" });
  }
}

export async function obtenerInstancia(req, res) {
  try {
    const row = await GastoEstimadoInstancia.findByPk(req.params.id);
    if (!row) return res.status(404).json({ error: "No encontrada" });
    res.json(row);
  } catch (e) {
    console.error("obtenerInstancia", e);
    res.status(500).json({ error: "Error obteniendo instancia" });
  }
}

export async function actualizarInstancia(req, res) {
  try {
    const row = await GastoEstimadoInstancia.findByPk(req.params.id);
    if (!row) return res.status(404).json({ error: "No encontrada" });

    await row.update(req.body || {});
    await recomputarEstado(row);

    res.json(row);
  } catch (e) {
    console.error("actualizarInstancia", e);
    res.status(500).json({ error: "Error actualizando instancia" });
  }
}

export async function eliminarInstancia(req, res) {
  try {
    const row = await GastoEstimadoInstancia.findByPk(req.params.id);
    if (!row) return res.status(404).json({ error: "No encontrada" });
    await row.update({ anulado: true, estado: "anulado" });
    res.json({ ok: true });
  } catch (e) {
    console.error("eliminarInstancia", e);
    res.status(500).json({ error: "Error eliminando instancia" });
  }
}

// ---------- helper normalización de headers ----------
function normHeader(h) {
  return String(h || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^\w]/g, "");
}

// ---------- helper: parse bool ----------
function parseBool(v) {
  if (v === true || v === false) return v;
  const s = String(v || "").trim().toLowerCase();
  return ["1", "true", "si", "sí", "y", "yes"].includes(s);
}

// ---------- helper: YYYY-MM desde fecha ----------
function periodFromDate(yyyy_mm_dd) {
  const s = String(yyyy_mm_dd || "").slice(0, 7);
  // basic guard
  return /^\d{4}-\d{2}$/.test(s) ? s : null;
}

// ---------- IMPORTAR ÚNICOS DESDE EXCEL/CSV ----------
// POST /gasto-estimado/importar-unicos  (usa upload.single("file") en las rutas)
export async function importarPlantillasUnicas(req, res) {
  try {
    const empresa_id = Number(req.body?.empresa_id);
    if (!(empresa_id > 0)) {
      return res.status(400).json({ error: "empresa_id requerido en el body (FormData)" });
    }
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ error: "Subí un archivo (xlsx/csv) en el campo 'file'." });
    }

    // Parsear Excel/CSV
    const wb = XLSX.read(req.file.buffer, { type: "buffer" });
    const wsName = wb.SheetNames[0];
    const ws = wb.Sheets[wsName];
    const rows = XLSX.utils.sheet_to_json(ws, { defval: null });

    // Catálogos para resolver por nombre
    const [proveedores, categorias] = await Promise.all([
      Proveedor.findAll(),
      CategoriaEgreso.findAll(),
    ]);

    // Mapas normalizados
    const provMap = new Map(); // nombre -> array (para detectar ambigüedad)
    proveedores.forEach(p => {
      const visible = p.razonsocial || p.nombre || p.descripcion || `Proveedor ${p.id}`;
      const key = normName(visible);
      if (!provMap.has(key)) provMap.set(key, []);
      provMap.get(key).push(p);
    });

    const catMap = new Map(); // nombre -> categoría
    categorias.forEach(c => catMap.set(normName(c.nombre), c));

    const results = [];
    let created = 0;
    let failed = 0;

    for (let i = 0; i < rows.length; i++) {
      const raw = rows[i] || {};
      // Columnas principales por nombre
      const descripcion = String(raw.descripcion || "").trim();
      const proveedorNombre = String(raw.proveedor || "").trim();
      const categoriaNombre = String(raw.categoria || "").trim();
      // Fecha y monto
      let fecha_vencimiento = null;
      if (raw.fecha_vencimiento) {
        // soporta Date excel / yyyy-mm-dd / dd-mm-yyyy / dd/mm/yyyy
        if (raw.fecha_vencimiento instanceof Date && !isNaN(raw.fecha_vencimiento)) {
          fecha_vencimiento = raw.fecha_vencimiento.toISOString().slice(0, 10);
        } else {
          const s = String(raw.fecha_vencimiento).trim();
          if (/^\d{4}-\d{2}-\d{2}$/.test(s)) fecha_vencimiento = s;
          else {
            const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
            if (m) {
              const [_, d, mo, y] = m;
              fecha_vencimiento = `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
            }
          }
        }
      }
      const monto = Number(raw.monto || raw.monto_estimado || raw.importe);

      // Opcionales
      const sucursal_id = raw["sucursal_id (op)"] != null ? Number(raw["sucursal_id (op)"]) :
        raw.sucursal_id != null ? Number(raw.sucursal_id) : null;
      const requiere_factura = raw.requiere_factura != null ? parseBool(raw.requiere_factura) : null;
      const observaciones = raw["observaciones (op)"] != null ? String(raw["observaciones (op)"]).trim() :
        raw.observaciones != null ? String(raw.observaciones).trim() : null;
      const tipocomprobante_id = raw.tipocomprobante_id != null ? Number(raw.tipocomprobante_id) : null;
      const formapago_id = raw.formapago_id != null ? Number(raw.formapago_id) : null;

      // Validaciones mínimas
      const errs = [];
      if (!descripcion) errs.push("descripcion requerida");
      if (!proveedorNombre) errs.push("proveedor requerido");
      if (!categoriaNombre) errs.push("categoria requerida");
      if (!fecha_vencimiento || !/^\d{4}-\d{2}-\d{2}$/.test(fecha_vencimiento)) errs.push("fecha_vencimiento (YYYY-MM-DD) requerida");
      if (!(monto > 0)) errs.push("monto > 0 requerido");

      // Resolver proveedor
      let proveedor_id = null;
      if (proveedorNombre) {
        const list = provMap.get(normName(proveedorNombre)) || [];
        if (list.length === 1) proveedor_id = list[0].id;
        else if (list.length === 0) errs.push(`Proveedor '${proveedorNombre}' no encontrado`);
        else errs.push(`Proveedor '${proveedorNombre}' ambiguo (${list.length} coincidencias)`);
      }

      // Resolver categoría
      let categoriaegreso_id = null;
      if (categoriaNombre) {
        const c = catMap.get(normName(categoriaNombre));
        if (!c) errs.push(`Categoría '${categoriaNombre}' no encontrada`);
        else categoriaegreso_id = c.id;
      }

      if (errs.length) {
        failed++;
        results.push({ row: i + 2, ok: false, error: errs.join("; ") });
        continue;
      }

      const periodo = String(fecha_vencimiento).slice(0, 7); // 'YYYY-MM'
      const t = await sequelize.transaction();
      try {
        // 1) Plantilla (UNICO, sin rollover)
        const plantilla = await GastoEstimado.create({
          empresa_id,
          proveedor_id,
          categoriaegreso_id,
          descripcion,
          periodicidad: "unico",
          dia_vencimiento_default: Number(fecha_vencimiento.slice(8, 10)),
          monto_estimado_default: monto,
          sucursal_id,
          tipocomprobante_id,
          formapago_id,
          requiere_factura: requiere_factura ?? null,
          activo: true,
          observaciones,
        }, { transaction: t });

        // 2) Instancia única
        const instancia = await GastoEstimadoInstancia.create({
          gastoestimado_id: plantilla.id,
          empresa_id,
          proveedor_id,
          categoriaegreso_id,
          sucursal_id,
          tipocomprobante_id,
          formapago_id,
          descripcion,
          periodo,
          fecha_vencimiento,
          monto_estimado: monto,
          monto_real: null,
          monto_pagado: 0,
          estado: "pendiente",
          anulado: false,
          created_from: "importado",
          observaciones,
        }, { transaction: t });

        await t.commit();
        created++;
        results.push({ row: i + 2, ok: true, plantilla_id: plantilla.id, instancia_id: instancia.id });
      } catch (e) {
        await t.rollback();
        failed++;
        results.push({ row: i + 2, ok: false, error: e.message || "Error creando registros" });
      }
    }

    return res.json({
      ok: true, created, failed, total: rows.length, results,
      hint: "Usá el template XLSX: columnas obligatorias = descripcion, proveedor, categoria, fecha_vencimiento, monto."
    });
  } catch (e) {
    console.error("importarPlantillasUnicas", e);
    return res.status(500).json({ error: "Error importando archivo" });
  }
}

// GET /gasto-estimado/unicos/template.xlsx
export async function descargarTemplateXlsxUnicos(req, res) {
  try {
    const proveedores = await Proveedor.findAll({ order: [["nombre", "ASC"]] });
    const categorias = await CategoriaEgreso.findAll({ order: [["nombre", "ASC"]] });

    const wb = new ExcelJS.Workbook();
    wb.created = new Date();

    // Hoja principal (Carga)
    const ws = wb.addWorksheet("Carga");
    ws.columns = [
      { header: "descripcion", key: "descripcion", width: 40 },
      { header: "proveedor", key: "proveedor", width: 32 },
      { header: "categoria", key: "categoria", width: 28 },
      { header: "fecha_vencimiento", key: "fecha_venc", width: 16 },
      { header: "monto", key: "monto", width: 14 },
    ];
    ws.getRow(1).font = { bold: true };

    // Hojas de listas (ocultas)
    const wsProv = wb.addWorksheet("Proveedores", { views: [{ state: "veryHidden" }] });
    wsProv.columns = [{ header: "nombre_proveedor", key: "nombre", width: 60 }];
    proveedores.forEach(p =>
      wsProv.addRow({ nombre: p.razonsocial || p.nombre || p.descripcion || `Proveedor ${p.id}` })
    );

    const wsCat = wb.addWorksheet("Categorias", { views: [{ state: "veryHidden" }] });
    wsCat.columns = [{ header: "nombre_categoria", key: "nombre", width: 50 }];
    categorias.forEach(c => wsCat.addRow({ nombre: c.nombre }));

    // Validaciones de lista (hasta 2000 filas)
    const MAX = 2000;
    ws.dataValidations.add(`B2:B${MAX}`, {
      type: "list",
      allowBlank: false,
      formulae: [`=Proveedores!$A$2:$A$${proveedores.length + 1}`],
      showErrorMessage: true,
      errorTitle: "Proveedor inválido",
      error: "Elegí un proveedor de la lista",
    });
    ws.dataValidations.add(`C2:C${MAX}`, {
      type: "list",
      allowBlank: false,
      formulae: [`=Categorias!$A$2:$A$${categorias.length + 1}`],
      showErrorMessage: true,
      errorTitle: "Categoría inválida",
      error: "Elegí una categoría de la lista",
    });

    // Ayuda
    const help = wb.addWorksheet("Ayuda");
    help.addRow(["Instrucciones"]).font = { bold: true };
    help.addRows([
      ["• Estos gastos se importan como 'unico' (sin rollover)."],
      ["• Columnas obligatorias: descripcion, proveedor, categoria, fecha_vencimiento (YYYY-MM-DD), monto (>0)."],
      ["• 'proveedor' y 'categoria' tienen listas desplegables actualizadas al momento de descargar."],
      ["• 'requiere_factura' admite: true/false/1/0/si/no."],
      ["• La empresa NO va en el archivo; se envía como empresa_id en el FormData del POST."],
    ]);

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", 'attachment; filename="gastos_unicos_template.xlsx"');
    await wb.xlsx.write(res);
    res.end();
  } catch (e) {
    console.error("descargarTemplateXlsxUnicos", e);
    res.status(500).json({ error: "No se pudo generar el template" });
  }
}
