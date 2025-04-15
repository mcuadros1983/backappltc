import VentaStatics from "../../models/statics/ventaStatics.js";
import xlsx from "xlsx";
import fs from "fs";
import { pipeline } from "stream";
import { promisify } from "util";
import { Op, Sequelize } from "sequelize";

const asyncPipeline = promisify(pipeline);

export const obtenerVentasAgrupadas = async (req, res) => {
  try {
    const { fechaDesde, fechaHasta } = req.body;

    if (!fechaDesde || !fechaHasta) {
      return res
        .status(400)
        .json({ message: "Debe proporcionar un rango de fechas válido." });
    }

    // Obtener ventas dentro del rango de fechas, no anuladas
    const ventas = await VentaStatics.findAll({
      where: {
        fecha2: { [Op.between]: [fechaDesde, fechaHasta] },
        anulada: false,
      },
      attributes: ["fecha2", "sucursal", "ticket", "monto"],
      raw: true,
    });

    // Mapa para almacenar las ventas agrupadas
    const ventasAgrupadas = {};

    ventas.forEach((venta) => {
      const key = `${venta.fecha2}-${venta.sucursal}`;

      // Si el ticket ya fue contado, evitamos sumar el monto de nuevo
      if (!ventasAgrupadas[key]) {
        ventasAgrupadas[key] = {
          fecha2: venta.fecha2,
          sucursal: venta.sucursal,
          monto_total: parseFloat(venta.monto), // Convertir a número
          ticketsProcesados: new Set([venta.ticket]), // Control de tickets únicos
        };
      } else {
        if (!ventasAgrupadas[key].ticketsProcesados.has(venta.ticket)) {
          ventasAgrupadas[key].monto_total += parseFloat(venta.monto);
          ventasAgrupadas[key].ticketsProcesados.add(venta.ticket);
        }
      }
    });

    // Convertir a array eliminando el campo de control de tickets
    const ventasAgrupadasArray = Object.values(ventasAgrupadas).map(
      ({ ticketsProcesados, ...resto }) => resto
    );

    res.json(ventasAgrupadasArray);
  } catch (error) {
    console.error("Error al obtener ventas agrupadas:", error);
    res.status(500).json({ message: "Error al obtener las ventas." });
  }
};

// **Definir las columnas esperadas en el archivo Excel**
const REQUIRED_COLUMNS = [
  "item_id",
  "sucursal",
  "data",
  "ticket",
  "cliente",
  "dni",
  "monto",
  "descuento",
  "anulada",
  "usuario",
  "articulo",
  "cantidad",
  "totalitem",
  "preciopromo",
  "preciolista",
  "fecha2",
];

// **Función para validar las filas del archivo**
const validarFila = (row) => {
  if (!row["item_id"] || !row["sucursal"] || !row["ticket"] || !row["fecha2"]) {
    return false;
  }
  if (
    isNaN(row["monto"]) ||
    isNaN(row["descuento"]) ||
    isNaN(row["cantidad"]) ||
    isNaN(row["totalitem"])
  ) {
    return false;
  }
  return true;
};

// **Cargar el archivo en memoria en chunks y validar datos antes de insertarlos**
export const uploadVentas = async (req, res) => {
  // console.log("📂 Recibiendo archivo...");

  if (!req.file) {
    console.error("⚠️ No se subió ningún archivo.");
    return res.status(400).json({ message: "No se subió ningún archivo." });
  }

  // Validar si es un archivo Excel
  const fileExtension = req.file.originalname.split(".").pop();
  if (!["xls", "xlsx"].includes(fileExtension)) {
    console.error("⚠️ Formato de archivo no soportado:", req.file.originalname);
    return res
      .status(400)
      .json({ message: "Formato de archivo no soportado. Use .xlsx o .xls" });
  }

  try {
    // console.log("📖 Leyendo archivo Excel...");
    const workbook = xlsx.readFile(req.file.path, { cellDates: true });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const datos = xlsx.utils.sheet_to_json(sheet);

    console.log(`📊 Se encontraron ${datos.length} registros en el archivo.`);

    // Verificar que las columnas requeridas existan
    const columnasArchivo = Object.keys(datos[0] || {});
    const columnasFaltantes = REQUIRED_COLUMNS.filter(
      (col) => !columnasArchivo.includes(col)
    );

    if (columnasFaltantes.length > 0) {
      console.error("⚠️ Columnas faltantes:", columnasFaltantes);
      return res.status(400).json({
        message: `El archivo no contiene las columnas requeridas: ${columnasFaltantes.join(
          ", "
        )}`,
      });
    }

    const batchSize = 500; // Procesar en lotes de 500 registros
    let batch = [];
    let totalGuardados = 0;

    for (const row of datos) {
      if (!validarFila(row)) {
        // console.warn("⚠️ Fila inválida:", row);
        continue; // Omitir filas con datos inválidos
      }

      batch.push({
        item_id: row["item_id"],
        sucursal: row["sucursal"],
        data: row["data"],
        ticket: row["ticket"],
        cliente: row["cliente"] || null,
        dni: row["dni"] || null,
        monto: Number(String(row["monto"]).replace(",", ".")),
        descuento: Number(String(row["descuento"] || 0).replace(",", ".")),
        anulada: row["anulada"] === "Si" ? true : false,
        usuario: row["usuario"],
        articulo: row["articulo"],
        cantidad: Number(String(row["cantidad"]).replace(",", ".")),
        totalitem: Number(String(row["totalitem"]).replace(",", ".")),
        preciopromo: Number(String(row["preciopromo"] || 0).replace(",", ".")),
        preciolista: Number(String(row["preciolista"] || 0).replace(",", ".")),
        fecha2: row["fecha2"],
      });

      if (batch.length >= batchSize) {
        // console.log(
        // `💾 Guardando lote de ${batch.length} registros en la base de datos...`
        // );
        await VentaStatics.bulkCreate(batch, { ignoreDuplicates: true });
        totalGuardados += batch.length;
        batch = [];
      }
    }

    if (batch.length > 0) {
      // console.log(`💾 Guardando último lote de ${batch.length} registros...`);
      await VentaStatics.bulkCreate(batch, { ignoreDuplicates: true });
      totalGuardados += batch.length;
    }

    console.log(
      `✅ Se guardaron correctamente ${totalGuardados} registros en la base de datos.`
    );

    return res
      .status(200)
      .json({ message: "Ventas cargadas exitosamente.", totalGuardados });
  } catch (error) {
    console.error("❌ Error al procesar el archivo:", error);
    return res
      .status(500)
      .json({ message: "Error al procesar el archivo.", error: error.message });
  } finally {
    // Eliminar el archivo temporal después de procesarlo
    fs.unlink(req.file.path, (err) => {
      if (err) console.error("⚠️ Error al eliminar archivo:", err);
    });
  }
};

// Obtener todas las ventas
export const getVentas = async (req, res) => {
  try {
    const ventas = await VentaStatics.findAll();
    res.json(ventas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener ventas." });
  }
};

// Eliminar todas las ventas (opcional para reiniciar carga)
export const deleteVentas = async (req, res) => {
  try {
    await VentaStatics.destroy({ where: {} });
    res.json({ message: "Todas las ventas han sido eliminadas." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al eliminar ventas." });
  }
};
