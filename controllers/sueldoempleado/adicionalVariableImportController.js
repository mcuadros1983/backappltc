// controllers/sueldoempleado/adicionalVariableImportItemsController.js
import ExcelJS from "exceljs";
import * as XLSX from "xlsx";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat.js";
dayjs.extend(customParseFormat);

import EmpleadoTabla from "../../models/tablas/empleadoModel.js";
import AdicionalVariable from "../../models/sueldoempleado/adicionalvariable.js";
import AdicionalVariableTipo from "../../models/sueldoempleado/adicionalvariabletipo.js";
import PeriodoLiquidacion from "../../models/sueldoempleado/periodoliquidacion.js";

/* =========================
   Helpers
   ========================= */

// Normaliza celdas a string (o vacío)
const cell = (v) => (v === undefined || v === null ? "" : String(v).trim());

// Valida período YYYY-MM
const isPeriodoValido = (s) =>
  typeof s === "string" &&
  /^\d{4}-\d{2}$/.test(s) &&
  dayjs(s + "-01", "YYYY-MM-DD", true).isValid();

// Convierte varias entradas de fecha a ISO (YYYY-MM-DD)
// Acepta: "DD/MM/YYYY", "YYYY-MM-DD", Date, número serial Excel
const toISODate = (v) => {
  if (v === null || v === undefined || v === "") return null;

  // Date (cuando XLSX parsea fecha a Date)
  if (v instanceof Date && !Number.isNaN(v.getTime())) {
    const d = dayjs(v);
    return d.isValid() ? d.format("YYYY-MM-DD") : null;
  }

  // Número serial Excel (muy común si el archivo trae celdas con formato fecha)
  if (typeof v === "number" && !Number.isNaN(v)) {
    // Excel serial date: días desde 1899-12-30 (corrección del bug de 1900).
    // XLSX utils trae ya Date a veces; por compatibilidad convertimos manual:
    // 25569 = 1970-01-01; cada día = 86400 seg
    const epochMs = Math.round((v - 25569) * 86400 * 1000);
    const d = dayjs(epochMs);
    return d.isValid() ? d.format("YYYY-MM-DD") : null;
  }

  const s = String(v).trim();

  // DD/MM/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) {
    const d = dayjs(s, "DD/MM/YYYY", true);
    return d.isValid() ? d.format("YYYY-MM-DD") : null;
  }

  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const d = dayjs(s, "YYYY-MM-DD", true);
    return d.isValid() ? d.format("YYYY-MM-DD") : null;
  }

  // Intento la fecha ISO por si viene con tiempo
  const d = dayjs(s);
  return d.isValid() ? d.format("YYYY-MM-DD") : null;
};

const primeroDelMes = (anio, mes) =>
  dayjs(`${anio}-${String(mes).padStart(2, "0")}-01`, "YYYY-MM-DD", true);

const ultimoDelMes = (anio, mes) => primeroDelMes(anio, mes).endOf("month");

// Fuerza el monto a negativo (si es positivo, lo invierte)
const toNegative = (n) => {
  const x = Number(n);
  if (Number.isNaN(x)) return NaN;
  return x > 0 ? -x : x;
};

const makeCache = () => {
  const empPorDni = new Map();     // dni -> empleado_id
  const tipoPorClave = new Map();  // "id:12" / "desc:xxx" -> tipo_id
  const periodoPorKey = new Map(); // "YYYY-MM" -> periodo_id
  return { empPorDni, tipoPorClave, periodoPorKey };
};

const getEmpleadoIdPorDni = async (dni, cache) => {
  if (cache.empPorDni.has(dni)) return cache.empPorDni.get(dni);
  const emp = await EmpleadoTabla.findOne({ where: { numero: dni } });
  const id = emp?.id || null;
  cache.empPorDni.set(dni, id);
  return id;
};

const getTipoId = async (tipoValor, cache, createMissing) => {
  // número => id directo
  const asNum = Number(tipoValor);
  if (!Number.isNaN(asNum)) {
    const key = `id:${asNum}`;
    if (cache.tipoPorClave.has(key)) return cache.tipoPorClave.get(key);
    const tipo = await AdicionalVariableTipo.findByPk(asNum);
    const id = tipo?.id || null;
    cache.tipoPorClave.set(key, id);
    return id;
  }
  // string => descripción exacta
  const desc = String(tipoValor).trim();
  const key = `desc:${desc.toLowerCase()}`;
  if (cache.tipoPorClave.has(key)) return cache.tipoPorClave.get(key);
  let tipo = await AdicionalVariableTipo.findOne({ where: { descripcion: desc } });
  if (!tipo && createMissing) {
    tipo = await AdicionalVariableTipo.create({ descripcion: desc, categoria: null });
  }
  const id = tipo?.id || null;
  cache.tipoPorClave.set(key, id);
  return id;
};

// Busca o crea PeriodoLiquidacion por (anio, mes) y devuelve su id.
const getPeriodoId = async (periodoYYYYMM, cache) => {
  if (cache.periodoPorKey.has(periodoYYYYMM)) return cache.periodoPorKey.get(periodoYYYYMM);
  const [anioStr, mesStr] = periodoYYYYMM.split("-");
  const anio = Number(anioStr);
  const mes = Number(mesStr);

  let row = await PeriodoLiquidacion.findOne({ where: { anio, mes } });
  if (!row) {
    const fd = primeroDelMes(anio, mes);
    const fh = ultimoDelMes(anio, mes);
    row = await PeriodoLiquidacion.create({
      anio,
      mes,
      fecha_desde: fd.format("YYYY-MM-DD"),
      fecha_hasta: fh.format("YYYY-MM-DD"),
      estado: "abierto",
    });
  }
  cache.periodoPorKey.set(periodoYYYYMM, row.id);
  return row.id;
};

/* =========================
   Template
   ========================= */
export const descargarTemplateAdicionalVariable = async (_req, res) => {
  try {
    // Lista para el desplegable de tipos
    const tipos = await AdicionalVariableTipo.findAll({
      attributes: ["descripcion"],
      order: [["descripcion", "ASC"]],
    });
    const listaDescs = tipos.map((t) => t.descripcion || "").filter(Boolean);

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("items");

    // Encabezados (incluimos fecha)
    ws.addRow(["dni", "periodo", "tipo", "fecha", "monto", "observaciones"]);
    ws.getRow(1).font = { bold: true };

    // Ejemplos (el usuario puede escribir la fecha en DD/MM/AAAA y el back la convertirá)
    ws.addRow(["12345678", "2025-08", listaDescs[0] || "VALE", "15/08/2025", 10000, "Ejemplo"]);
    ws.addRow(["87654321", "2025-08", listaDescs[1] || "ADELANTO", "", 5000, ""]);

    // Anchos
    ws.getColumn(1).width = 14; // dni
    ws.getColumn(2).width = 10; // periodo
    ws.getColumn(3).width = 28; // tipo
    ws.getColumn(4).width = 14; // fecha (DD/MM/AAAA o YYYY-MM-DD)
    ws.getColumn(5).width = 12; // monto
    ws.getColumn(6).width = 30; // observaciones

    // Hoja oculta para la lista
    const wsTipos = wb.addWorksheet("tipos", { state: "veryHidden" });
    wsTipos.getColumn(1).width = 50;
    wsTipos.getRow(1).values = ["descripcion"];
    wsTipos.getRow(1).font = { bold: true };
    listaDescs.forEach((desc, i) => {
      wsTipos.getCell(`A${i + 2}`).value = desc;
    });
    const lastRow = Math.max(2, listaDescs.length + 1);
    const listaRango = `=tipos!$A$2:$A$${lastRow}`;

    // Validación para "tipo" (columna C)
    for (let r = 2; r <= 2000; r++) {
      ws.getCell(`C${r}`).dataValidation = {
        type: "list",
        allowBlank: true,              // permitir celda vacía (el back igual valida)
        showErrorMessage: false,       // ⚠️ no bloquear valores fuera de la lista
        showInputMessage: true,        // mostrar tip al editar la celda
        promptTitle: "Tipo (sugerido)",
        prompt: "Podés elegir de la lista o escribir uno nuevo. Si no existe y marcás 'Crear tipos faltantes', se creará automáticamente.",
        formulae: [listaRango],        // mantiene el desplegable como sugerencia
      };
      // No restringimos fecha: el backend soporta DD/MM/YYYY, YYYY-MM-DD, Date, serial Excel.
      // Monto puede ser +/-; el backend normaliza a negativo.
    }

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="adicionales_variables_items_template.xlsx"'
    );
    await wb.xlsx.write(res);
    res.end();
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "No se pudo generar el template" });
  }
};

/* =========================
   Importación
   ========================= */export const importarAdicionalVariable = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Archivo no enviado (campo 'file')." });

    const createMissing =
      req.query.create_missing_tipos === "1" || req.query.create_missing_tipos === "true";

    // Leemos primera hoja
    const wb = XLSX.read(req.file.buffer, { type: "buffer" });
    const sheetName = wb.SheetNames[0];
    if (!sheetName) return res.status(400).json({ error: "El archivo no contiene hojas." });
    const sheet = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: null });

    if (!rows.length) return res.status(400).json({ error: "La hoja está vacía." });

    // Esperamos columnas: dni, periodo (YYYY-MM), tipo (id/desc), fecha (DD/MM/YYYY o YYYY-MM-DD o Date/serial), monto, observaciones
    const cache = makeCache();
    const out = {
      totalFilas: rows.length,
      insertados: 0,
      errores: [],   // {row, error}
      detalles: [],  // {row, id, empleado_id, adicionalvariabletipo_id, periodo, periodo_id, fecha, monto}
    };

    for (let i = 0; i < rows.length; i++) {
      const raw = rows[i];
      const idx = i + 2; // fila real (asumiendo encabezados en 1)

      const dni = cell(raw.dni);
      const periodo = cell(raw.periodo);
      const tipo = raw.tipo;           // id o descripción
      const fechaRaw = raw.fecha;          // puede ser string DD/MM/YYYY o YYYY-MM-DD, Date o serial
      const montoVal = raw.monto;
      const observaciones = raw.observaciones == null ? null : String(raw.observaciones);

      // Validaciones mínimas
      if (!dni) {
        out.errores.push({ row: idx, error: "Falta DNI" });
        continue;
      }
      if (!isPeriodoValido(periodo)) {
        out.errores.push({ row: idx, error: "Periodo inválido (use YYYY-MM)" });
        continue;
      }
      if (tipo == null || String(tipo).trim() === "") {
        out.errores.push({ row: idx, error: "Falta 'tipo' (id o descripción)" });
        continue;
      }
      if (montoVal == null || Number.isNaN(Number(montoVal))) {
        out.errores.push({ row: idx, error: "Monto inválido" });
        continue;
      }

      // Normalizar fecha a ISO (o null si no viene)
      const fechaISO = toISODate(fechaRaw);
      if (fechaRaw && !fechaISO) {
        out.errores.push({ row: idx, error: "Fecha inválida (use DD/MM/AAAA o YYYY-MM-DD)" });
        continue;
      }

      // Resolver empleado
      const empleado_id = await getEmpleadoIdPorDni(dni, cache);
      if (!empleado_id) {
        out.errores.push({ row: idx, error: `Empleado no encontrado para DNI ${dni}` });
        continue;
      }

      // Resolver tipo -> OBTENER TIPO ROW para usar su descripcion
      let tipoRow = null;
      const asNum = Number(tipo);
      if (!Number.isNaN(asNum)) {
        // viene como id
        tipoRow = await AdicionalVariableTipo.findByPk(asNum);
      } else {
        // viene como descripción exacta
        const desc = String(tipo).trim();
        tipoRow = await AdicionalVariableTipo.findOne({ where: { descripcion: desc } });
      }

      // Crear tipo si no existe y está habilitado
      if (!tipoRow && createMissing) {
        tipoRow = await AdicionalVariableTipo.create({
          descripcion: String(tipo).trim(),
          categoria: null,
        });
      }

      if (!tipoRow) {
        out.errores.push({ row: idx, error: `Tipo no existente: ${String(tipo)}` });
        continue;
      }

      const adicionalvariabletipo_id = tipoRow.id;
      const descripcionTipo = tipoRow.descripcion; // <- la vamos a copiar al item

      // Resolver periodo_id (buscar/crear PeriodoLiquidacion)
      const periodo_id = await getPeriodoId(periodo, cache);

      // Monto: guardar SIEMPRE negativo
      const monto = toNegative(montoVal);
      if (Number.isNaN(monto) || monto === 0) {
        // ignoramos 0
        continue;
      }

      // Crear adicional variable (copiamos la descripcion del tipo)
      const created = await AdicionalVariable.create({
        empleado_id,
        adicionalvariabletipo_id,
        descripcion: descripcionTipo,   // <-- descripción tomada del tipo
        periodo,                        // string para compatibilidad
        periodo_id,                     // FK al período (nuevo)
        fecha: fechaISO || null,
        monto,
        observaciones,
      });

      out.insertados += 1;
      out.detalles.push({
        row: idx,
        id: created.id,
        empleado_id,
        adicionalvariabletipo_id,
        periodo,
        periodo_id,
        fecha: fechaISO || null,
        monto,
      });
    }

    res.json(out);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error al procesar el archivo" });
  }
};

