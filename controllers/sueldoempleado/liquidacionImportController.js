import ExcelJS from "exceljs";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat.js";
dayjs.extend(customParseFormat);

import EmpleadoTabla from "../../models/tablas/empleadoModel.js";
import PeriodoLiquidacion from "../../models/sueldoempleado/periodoliquidacion.js";
import Recibo from "../../models/sueldoempleado/recibo.js";
import AdicionalVariable from "../../models/sueldoempleado/adicionalvariable.js";

const isPeriodo = (s) =>
    typeof s === "string" &&
    /^\d{4}-\d{2}$/.test(s) &&
    dayjs(s + "-01", "YYYY-MM-DD", true).isValid();

const primeroDelMes = (anio, mes) => dayjs(`${anio}-${String(mes).padStart(2, "0")}-01`);
const ultimoDelMes = (anio, mes) => primeroDelMes(anio, mes).endOf("month");

export const importarRecibosExcel = async (req, res) => {
  try {
    const empresa_id = Number(req.query.empresa_id);
    if (!empresa_id) return res.status(400).json({ error: "Falta empresa_id en query" });

    if (!req.file) return res.status(400).json({ error: "Archivo no enviado (campo 'file')." });

    const replace = req.query.replace === "1" || req.query.replace === "true";

    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(req.file.buffer);
    const ws = wb.worksheets[0];
    if (!ws) return res.status(400).json({ error: "El archivo no contiene hojas." });

    // Helpers
    const isPeriodo = (s) =>
      typeof s === "string" &&
      /^\d{4}-\d{2}$/.test(s) &&
      dayjs(s + "-01", "YYYY-MM-DD", true).isValid();

    const primeroDelMes = (anio, mes) => dayjs(`${anio}-${String(mes).padStart(2, "0")}-01`);
    const ultimoDelMes = (anio, mes) => primeroDelMes(anio, mes).endOf("month");

    // Encabezados
    const header = {};
    ws.getRow(1).eachCell((c, col) => {
      header[String(c.value).trim().toLowerCase()] = col;
    });

    // Base obligatoria
    const colDni     = header["dni"];
    const colPeriodo = header["periodo"];
    if (!colDni || !colPeriodo) {
      return res.status(400).json({ error: "Encabezados requeridos: dni, periodo" });
    }

    // Base opcional
    const colFechaDesde   = header["fecha_desde"];
    const colFechaHasta   = header["fecha_hasta"];
    const colEstado       = header["estado"];
    const colSueldo       = header["sueldo"];
    const colACobrarBanco = header["acobrarporbanco"];

    // Cualquier otra columna = adicional dinámico
    const baseCols = new Set(
      ["dni", "periodo", "fecha_desde", "fecha_hasta", "estado", "sueldo", "acobrarporbanco"]
        .map((k) => header[k])
        .filter(Boolean)
    );

    const out = {
      totalFilas: 0,
      creados: 0,
      actualizados: 0,
      duplicados: 0,
      adicionalesInsertados: 0,
      errores: [],   // { row, error }
      detalles: [],  // { row, empleado_id, periodo_id, recibo_id, accion, adicionales_creados }
      adicionales: [] // { row, empleado_id, descripcion, periodo, periodo_id, monto, id }
    };

    // caches
    const cacheEmpByDni = new Map();
    const cachePeriodo = new Map();

    const getEmpleadoIdByDni = async (dni) => {
      if (cacheEmpByDni.has(dni)) return cacheEmpByDni.get(dni);
      const emp = await EmpleadoTabla.findOne({ where: { numero: dni } });
      const id = emp?.id || null;
      cacheEmpByDni.set(dni, id);
      return id;
    };

    const getPeriodoId = async (anio, mes, fecha_desde_opt, fecha_hasta_opt) => {
      const key = `${anio}-${String(mes).padStart(2, "0")}`;
      if (cachePeriodo.has(key)) return cachePeriodo.get(key);

      let row = await PeriodoLiquidacion.findOne({ where: { anio, mes } });
      if (!row) {
        const fd = fecha_desde_opt
          ? dayjs(fecha_desde_opt, "YYYY-MM-DD", true)
          : primeroDelMes(anio, mes);
        const fh = fecha_hasta_opt
          ? dayjs(fecha_hasta_opt, "YYYY-MM-DD", true)
          : ultimoDelMes(anio, mes);

        row = await PeriodoLiquidacion.create({
          anio,
          mes,
          fecha_desde: fd.format("YYYY-MM-DD"),
          fecha_hasta: fh.format("YYYY-MM-DD"),
          estado: "abierto",
        });
      }

      cachePeriodo.set(key, row.id);
      return row.id;
    };

    for (let r = 2; r <= ws.rowCount; r++) {
      const row = ws.getRow(r);
      if (row.getCell(colDni).value == null && row.getCell(colPeriodo).value == null) continue;

      out.totalFilas++;

      const dni         = String(row.getCell(colDni).value || "").trim();
      const periodoStr  = String(row.getCell(colPeriodo).value || "").trim();
      const fecha_desde = colFechaDesde ? String(row.getCell(colFechaDesde).value || "").trim() : "";
      const fecha_hasta = colFechaHasta ? String(row.getCell(colFechaHasta).value || "").trim() : "";
      const estado      = colEstado ? String(row.getCell(colEstado).value || "").trim() : "calculado";

      const sueldo = colSueldo ? row.getCell(colSueldo).value : null;
      const aBanco = colACobrarBanco ? row.getCell(colACobrarBanco).value : null;

      // validaciones
      if (!dni) {
        out.errores.push({ row: r, error: "Falta DNI" });
        continue;
      }
      if (!isPeriodo(periodoStr)) {
        out.errores.push({ row: r, error: "Periodo inválido (use YYYY-MM)" });
        continue;
      }
      if (fecha_desde && !dayjs(fecha_desde, "YYYY-MM-DD", true).isValid()) {
        out.errores.push({ row: r, error: "fecha_desde inválida (YYYY-MM-DD)" });
        continue;
      }
      if (fecha_hasta && !dayjs(fecha_hasta, "YYYY-MM-DD", true).isValid()) {
        out.errores.push({ row: r, error: "fecha_hasta inválida (YYYY-MM-DD)" });
        continue;
      }

      const [anioStr, mesStr] = periodoStr.split("-");
      const anio = Number(anioStr);
      const mes  = Number(mesStr);

      // resolver empleado
      const empleado_id = await getEmpleadoIdByDni(dni);
      if (!empleado_id) {
        out.errores.push({ row: r, error: `Empleado no encontrado para DNI ${dni}` });
        continue;
      }

      // resolver/crear periodo y obtener su ID
      const periodo_id = await getPeriodoId(anio, mes, fecha_desde || null, fecha_hasta || null);

      // upsert recibo
      const where = { periodo_id, empleado_id, empresa_id };
      let recibo = await Recibo.findOne({ where });

      // seteo de campos (si vienen)
      const patch = {};
      if (estado) patch.estado = estado;
      if (sueldo !== null && sueldo !== "" && !Number.isNaN(Number(sueldo))) patch.sueldo = Number(sueldo);
      if (aBanco !== null && aBanco !== "" && !Number.isNaN(Number(aBanco))) patch.acobrarporbanco = Number(aBanco);

      if (!recibo) {
        recibo = await Recibo.create({ ...where, ...patch });
        out.creados++;
        out.detalles.push({ row: r, empleado_id, periodo_id, recibo_id: recibo.id, accion: "creado", adicionales_creados: 0 });
      } else if (replace) {
        await recibo.update(patch);
        out.actualizados++;
        out.detalles.push({ row: r, empleado_id, periodo_id, recibo_id: recibo.id, accion: "actualizado", adicionales_creados: 0 });
      } else {
        out.duplicados++;
        out.detalles.push({ row: r, empleado_id, periodo_id, recibo_id: recibo.id, accion: "omitido (duplicado)", adicionales_creados: 0 });
      }

      // Crear adicionales dinámicos (todas las columnas no-base)
      let countAdic = 0;
      for (const [nameLower, colIdx] of Object.entries(header)) {
        const isBase = baseCols.has(colIdx);
        if (isBase) continue;

        // descripción = título de la columna tal cual figura en el archivo
        const descOriginal = Object.keys(header).find((k) => header[k] === colIdx) || nameLower;
        const valor = row.getCell(colIdx).value;

        // Saltar celdas vacías o 0
        if (valor === null || valor === "" || Number(valor) === 0) continue;
        if (Number.isNaN(Number(valor))) {
          // No numérico: ignoramos (o logueamos si querés)
          continue;
        }

        const created = await AdicionalVariable.create({
          descripcion: descOriginal,     // título de columna
          empleado_id,
          adicionalvariabletipo_id: null, // ya no se usa
          periodo: periodoStr,            // mantenemos el string por compatibilidad
          periodo_id,                     // <-- NUEVO: referenciamos al periodo
          monto: Number(valor),           // admite negativos (descuentos)
          observaciones: null,
        });

        out.adicionalesInsertados++;
        countAdic++;
        out.adicionales.push({
          row: r,
          id: created.id,
          empleado_id,
          descripcion: descOriginal,
          periodo: periodoStr,
          periodo_id, // devolvemos también el id
          monto: Number(valor),
        });
      }

      // actualizar conteo en detalle de la fila
      const last = out.detalles[out.detalles.length - 1];
      if (last && last.row === r) last.adicionales_creados = countAdic;
    }

    res.json(out);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error al procesar el archivo" });
  }
};

export const descargarTemplateRecibosExcel = async (_req, res) => {
    try {
        const wb = new ExcelJS.Workbook();
        const ws = wb.addWorksheet("recibos");

        // Encabezados base + columnas dinámicas de ejemplo
        ws.addRow(["dni", "periodo", "fecha_desde", "fecha_hasta", "estado", "sueldo", "acobrarporbanco", "adicional1", "adicional2"]);
        ws.getRow(1).font = { bold: true };

        // ejemplos
        ws.addRow(["12345678", "2025-08", "2025-08-01", "2025-08-31", "pendiente", 300000, 150000, 20000, -30000]);
        ws.addRow(["87654321", "2025-08", "2025-08-01", "2025-08-31", "pendiente", 400000, 200000, "", ""]);

        // tamaños
        ws.getColumn(1).width = 14; // dni
        ws.getColumn(2).width = 10; // periodo
        ws.getColumn(3).width = 12; // fecha_desde
        ws.getColumn(4).width = 12; // fecha_hasta
        ws.getColumn(5).width = 12; // estado
        ws.getColumn(6).width = 14; // sueldo
        ws.getColumn(7).width = 18; // acobrarporbanco
        ws.getColumn(8).width = 16; // adicional1
        ws.getColumn(9).width = 16; // adicional2

        // Validaciones (opcionales)
        for (let r = 2; r <= 2000; r++) {
            ws.getCell(`E${r}`).dataValidation = {
                type: "list",
                allowBlank: true,
                formulae: ['"calculado,pendiente,pagado"'],
                showErrorMessage: true,
                errorTitle: "Estado inválido",
                error: "Usá un estado de la lista",
            };
            // sueldo y acobrarporbanco numéricos >= 0 (permití negativos si querés)
            ws.getCell(`F${r}`).dataValidation = {
                type: "decimal",
                operator: "greaterThanOrEqual",
                showErrorMessage: true,
                allowBlank: true,
                formulae: [0],
                errorTitle: "Valor inválido",
                error: "Ingresá un número válido",
            };
            ws.getCell(`G${r}`).dataValidation = {
                type: "decimal",
                operator: "greaterThanOrEqual",
                showErrorMessage: true,
                allowBlank: true,
                formulae: [0],
                errorTitle: "Valor inválido",
                error: "Ingresá un número válido",
            };
            // adicionales: permitimos positivos y negativos → sin validación restrictiva
        }

        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", 'attachment; filename="recibos_template.xlsx"');
        await wb.xlsx.write(res);
        res.end();
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "No se pudo generar el template" });
    }
};
