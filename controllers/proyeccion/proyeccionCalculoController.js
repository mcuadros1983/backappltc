// server/controllers/proyeccion/proyeccionCalculoController.js
import { Op } from "sequelize";
import fetch from "node-fetch";
import ProyeccionFactor from "../../models/proyeccion/ProyeccionFactor.js";
import ProyeccionFeriado from "../../models/proyeccion/ProyeccionFeriado.js";
import ProyeccionResultado from "../../models/proyeccion/ProyeccionResultado.js"; // *** NUEVO
import Sucursal from "../../models/gmedias/sucursalModel.js"; // ajustá path real a tu modelo Sucursal
import { obtenerVentasFiltradasLikeController } from "./helpers/ventasRealHelper.js";

/**
 * Utils
 */

// arma un array de strings YYYY-MM-DD desde fechaInicio hasta fechaFin (incluidos)
function armarFechasRango(fechaInicio, fechaFin) {
  const out = [];
  let cursor = new Date(fechaInicio + "T00:00:00");
  const end = new Date(fechaFin + "T00:00:00");

  while (cursor <= end) {
    const y = cursor.getFullYear();
    const m = String(cursor.getMonth() + 1).padStart(2, "0");
    const d = String(cursor.getDate()).padStart(2, "0");
    out.push(`${y}-${m}-${d}`);
    cursor.setDate(cursor.getDate() + 1);
  }
  return out;
}

/**
 * Llamada al microservicio Python para pedir proyección base
 * filasParaProyectar = [
 *   { fecha: "2024-10-01", sucursal_id: 23 },
 *   { fecha: "2024-10-02", sucursal_id: 23 },
 *   ...
 * ]
 *
 * Devuelve algo tipo:
 * [
 *   { fecha: "2024-10-01", sucursal_id: 23, proyeccion: 2825011.23 },
 *   ...
 * ]
 */
async function pedirProyeccionBaseAlMicroservicio(filasParaProyectar) {
  // Vamos a construir un CSV en memoria con las columnas mínimas
  // que el microservicio espera para /proyectar/.
  //
  // IMPORTANTE:
  // El microservicio actual leía un archivo CSV enviado con multipart/form-data.
  // Ese CSV tenía al menos columnas: fecha, sucursal_id
  // (y puede aceptar otras columnas si querés sumar features).
  //
  // Acá vamos a generar un CSV dinámico y mandarlo como archivo "file".
  //
  const csvHeader = "fecha,sucursal_id\n";
  const csvRows = filasParaProyectar
    .map((row) => `${row.fecha},${row.sucursal_id}`)
    .join("\n");
  const csvContent = csvHeader + csvRows;

  // Tenemos que armar el body multipart/form-data a mano
  const boundary = "----NodeFormBoundary" + Math.random().toString(16).slice(2);

  const bodyParts = [];
  // campo "file"
  bodyParts.push(
    `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="file"; filename="input.csv"\r\n` +
      `Content-Type: text/csv\r\n\r\n` +
      csvContent +
      `\r\n`
  );
  bodyParts.push(`--${boundary}--\r\n`);

  const bodyBuffer = Buffer.from(bodyParts.join(""), "utf8");

  const PYTHON_URL = "http://127.0.0.1:8000/proyectar/"; // ajustar si tu micro está en otro host/puerto

  const res = await fetch(PYTHON_URL, {
    method: "POST",
    headers: {
      "Content-Type": `multipart/form-data; boundary=${boundary}`,
    },
    body: bodyBuffer,
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("Error FastAPI /proyectar/:", errText);
    throw new Error("Error obteniendo proyección base desde Python");
  }

  const data = await res.json();
  // data = [{ fecha, sucursal_id, proyeccion }, ...]

  return data;
}

/**
 * calculamos un factor de calibración por sucursal:
 *
 * idea:
 * - miramos las ventas reales recientes (últimos N días) de esa sucursal
 * - pedimos al microservicio cuál hubiera sido la proyección base para esos días
 * - sacamos promedioReal / promedioModelo = factor
 * - si algo falla devolvemos 1
 */

const DIAS_CALIBRACION = 14;

async function calcularFactorCalibracionSucursal({
  sucursalId,
}) {
  try {
    const hoy = new Date();
    const desdeDate = new Date(hoy);
    // tomamos ~2 semanas para promediar
    desdeDate.setDate(desdeDate.getDate() - DIAS_CALIBRACION - 1);
    const hastaDate = new Date(hoy);
    hastaDate.setDate(hastaDate.getDate() - 1); // hasta ayer

    const fechaDesde = desdeDate.toISOString().slice(0, 10); // YYYY-MM-DD
    const fechaHasta = hastaDate.toISOString().slice(0, 10);

    // 1) Traer ventas reales neteadas usando la misma lógica que tu controller de ventas.
    //    Esto devuelve [{ fecha, sucursal_id, monto }, ...]
    const ventasHistoricasArray = await obtenerVentasFiltradasLikeController({
      fechaDesde,
      fechaHasta,
      sucursalId,
    });

    // usar sólo días con monto > 0
    const ventasUtiles = ventasHistoricasArray
      .filter((v) => Number(v.sucursal_id) === Number(sucursalId))
      .filter((v) => Number(v.monto) > 0);

    if (ventasUtiles.length === 0) {
      console.log(
        `[CALIBRACION] suc ${sucursalId}: no hay ventas reales recientes -> factor=1`
      );
      return 1;
    }

    // 2) Le pedimos al microservicio que proyecte ESOS días como si fueran "futuro",
    //    para ver qué hubiera dicho el modelo base.
    const filasParaProyectar = ventasUtiles.map((row) => ({
      fecha: row.fecha, // YYYY-MM-DD
      sucursal_id: row.sucursal_id,
    }));

    const predPasadas = await pedirProyeccionBaseAlMicroservicio(
      filasParaProyectar
    );
    // predPasadas: [{fecha, sucursal_id, proyeccion}, ...]

    // 3) match por fecha y sucursal para sacar promedios comparables
    let sumaReal = 0;
    let sumaModelo = 0;
    let conteo = 0;

    for (const ventaDia of ventasUtiles) {
      const match = predPasadas.find(
        (p) =>
          String(p.fecha) === String(ventaDia.fecha) &&
          Number(p.sucursal_id) === Number(ventaDia.sucursal_id)
      );

      if (match && Number(match.proyeccion) > 0) {
        sumaReal += Number(ventaDia.monto);
        sumaModelo += Number(match.proyeccion);
        conteo += 1;
      }
    }

    if (conteo === 0) {
      console.log(
        `[CALIBRACION] suc ${sucursalId}: sin cruces válidos -> factor=1`
      );
      return 1;
    }

    const promedioReal = sumaReal / conteo;
    const promedioModelo = sumaModelo / conteo;

    if (promedioModelo <= 0) {
      console.log(
        `[CALIBRACION] suc ${sucursalId}: promedioModelo <=0 -> factor=1`
      );
      return 1;
    }

    const factor = promedioReal / promedioModelo;

    console.log(
      `[CALIBRACION] suc ${sucursalId}: promedioReal=${promedioReal.toFixed(
        2
      )} promedioModelo=${promedioModelo.toFixed(
        2
      )} => factor=${factor.toFixed(3)}`
    );

    return factor;
  } catch (err) {
    console.error(
      `[CALIBRACION] Error calibrando sucursal ${sucursalId}:`,
      err
    );
    return 1;
  }
}

/**
 * Dado un día concreto, calculamos los factores comerciales aplicables.
 * Vamos a juntar:
 *  - factores "globales"/reglas (ProyeccionFactor)
 *  - feriados/ajustes especiales puntuales (ProyeccionFeriado)
 *
 * Devolvemos:
 *  {
 *    multiplicadorFinal: 3.5,
 *    detalles: [
 *      { tipo: "fin_de_semana", nombre: "FINES DE SEMANA", factor: 1.3 },
 *      { tipo: "primera_semana", nombre: "PRIMERA SEMANA", factor: 1.2 },
 *    ]
 *  }
 */

function aplicaRangoFecha(fechaStr, desdeStr, hastaStr) {
  // ambas YYYY-MM-DD
  return fechaStr >= desdeStr && fechaStr <= hastaStr;
}

function esFinDeSemana(fechaStr) {
  const d = new Date(fechaStr + "T00:00:00");
  const dow = d.getDay(); // 0=Domingo ... 6=Sabado
  return dow === 0 || dow === 6 || dow === 5; // ejemplo: viernes/sabado/domingo
}

async function obtenerAjustesParaDia({
  fechaStr,
  sucursalId,
  factoresComerciales,
  feriadosConfig,
}) {
  let multiplicadorFinal = 1;
  const detalles = [];

  // 1) reglas generales (ProyeccionFactor)
  for (const regla of factoresComerciales) {
    // ejemplo de campos esperados:
    // regla.tipo ("PRIMERA SEMANA", "FINES DE SEMANA")
    // regla.factor_multiplicador (ej 1.3, 5.0, etc.)
    // regla.dia_inicio / dia_fin (ej "2024-10-01", "2024-10-10") o null para condiciones dinámicas
    // regla.aplica_finde? etc. Este modelo depende de cómo lo definiste.
    //
    // Supongamos que tus reglas tienen:
    // - regla.nombre (string visible en UI)
    // - regla.factor_multiplicador (number)
    // - regla.fecha_desde (string YYYY-MM-DD o null)
    // - regla.fecha_hasta (string YYYY-MM-DD o null)
    // - regla.aplica_finde (bool)
    // - regla.aplica_primera_semana (bool)
    // - regla.solo_sucursal_id (nullable)

    // Si la regla es específica de sucursal y no coincide -> saltar
    if (
      regla.solo_sucursal_id != null &&
      Number(regla.solo_sucursal_id) !== Number(sucursalId)
    ) {
      continue;
    }

    // chequear fecha_desde/hasta si existen
    if (
      regla.fecha_desde &&
      regla.fecha_hasta &&
      !aplicaRangoFecha(fechaStr, regla.fecha_desde, regla.fecha_hasta)
    ) {
      continue;
    }

    // Si pide fin de semana y este día NO es fin de semana, skip
    if (regla.aplica_finde && !esFinDeSemana(fechaStr)) {
      continue;
    }

    // Si pide "primera semana" y este día no está en los primeros X días del mes:
    if (regla.aplica_primera_semana) {
      const diaMes = Number(fechaStr.split("-")[2]);
      if (diaMes > (regla.hasta_dia_mes || 7)) {
        continue;
      }
    }

    // Pasa todos los filtros -> aplicamos
    multiplicadorFinal *= Number(regla.factor_multiplicador || 1);
    detalles.push({
      tipo: "factor_comercial",
      nombre: regla.nombre || "AJUSTE",
      factor: Number(regla.factor_multiplicador || 1),
    });
  }

  // 2) feriados / eventos puntuales (ProyeccionFeriado)
  //    ej: "el lunes 14 damos franco compensatorio, x0.5"
  for (const fer of feriadosConfig) {
    // supongamos fer = {
    //   fecha: "2024-10-14",
    //   sucursal_id: null (todas) o 23
    //   descripcion: "Franco compensatorio",
    //   factor_multiplicador: 0.5,
    //   activo: true
    // }

    if (!fer.activo) continue;
    if (fer.fecha !== fechaStr) continue;

    if (
      fer.sucursal_id != null &&
      Number(fer.sucursal_id) !== Number(sucursalId)
    ) {
      continue;
    }

    multiplicadorFinal *= Number(fer.factor_multiplicador || 1);
    detalles.push({
      tipo: "feriado",
      descripcion: fer.descripcion || "Ajuste especial",
      factor: Number(fer.factor_multiplicador || 1),
    });
  }

  return { multiplicadorFinal, detalles };
}

/**
 * Controller principal
 *
 * Espera en req.body:
 * {
 *   sucursalIds: [23, 5, ...],
 *   fechaInicio: "2024-10-01",
 *   fechaFin: "2024-10-15"
 * }
 *
 * Devuelve array con filas:
 * [
 *   {
 *     fecha: "2024-10-01",
 *     sucursal_id: 23,
 *     sucursal_nombre: "GUEMES",
 *     proyeccion_base: 7778221.23,   // ya calibrada
 *     proyeccion_final: 101524192.99,
 *     ajustes_aplicados: [
 *       { tipo: "factor_comercial", nombre: "PRIMERA SEMANA", factor: 1.2 },
 *       { tipo: "feriado", descripcion: "Feriado trabajado", factor: 1.3 }
 *     ]
 *   },
 *   ...
 * ]
 */
export const proyeccionCalculoController = {
  async calcularProyeccion(req, res) {
    try {
      const { sucursalIds, fechaInicio, fechaFin } = req.body;

      if (
        !Array.isArray(sucursalIds) ||
        sucursalIds.length === 0 ||
        !fechaInicio ||
        !fechaFin
      ) {
        return res
          .status(400)
          .json({ error: "Faltan sucursalIds, fechaInicio o fechaFin" });
      }

      // 1) Traemos info de sucursales para guardar nombre
      const sucursalesInfo = await Sucursal.findAll({
        where: { id: { [Op.in]: sucursalIds } },
      });
      const sucursalNombreMap = {};
      for (const s of sucursalesInfo) {
        sucursalNombreMap[String(s.id)] = s.nombre || `Sucursal ${s.id}`;
      }

      // 2) Traemos reglas comerciales activas (ProyeccionFactor)
      const factoresComerciales = await ProyeccionFactor.findAll({
        where: { activo: true },
        raw: true,
      });

      // 3) Traemos feriados/eventos especiales (ProyeccionFeriado)
      const feriadosConfig = await ProyeccionFeriado.findAll({
        where: { activo: true },
        raw: true,
      });

      // 4) Generamos todas las fechas del rango
      const fechasRango = armarFechasRango(fechaInicio, fechaFin);

      // 5) lote_calculo_id = timestamp para agrupar esta corrida
      const lote_calculo_id = Date.now();

      // 6) acá vamos a ir acumulando las filas que luego respondemos al front
      const respuestaFinal = [];

      // 7) Procesar sucursal por sucursal
      for (const sucursalId of sucursalIds) {
        // 7.1 calculamos factor de calibración para ESTA sucursal
        const factorCalibracion = await calcularFactorCalibracionSucursal({
          sucursalId,
        });

        // 7.2 armamos las filas a proyectar a futuro
        const filasFuturas = fechasRango.map((fechaStr) => ({
          fecha: fechaStr,
          sucursal_id: sucursalId,
        }));

        // 7.3 pedimos al microservicio la proyección base cruda
        const prediccionesCrudas =
          await pedirProyeccionBaseAlMicroservicio(filasFuturas);
        // prediccionesCrudas: [{fecha, sucursal_id, proyeccion}, ...]

        // 7.4 por cada día futuro de esta sucursal:
        for (const pred of prediccionesCrudas) {
          const fechaStr = pred.fecha;
          const sucId = pred.sucursal_id;
          const baseCruda = Number(pred.proyeccion) || 0;

          // aplicar calibración (escala sucursal)
          const baseCalibrada = baseCruda * factorCalibracion;

          // obtener factores comerciales + feriados
          const { multiplicadorFinal, detalles } =
            await obtenerAjustesParaDia({
              fechaStr,
              sucursalId: sucId,
              factoresComerciales,
              feriadosConfig,
            });

          // proyección final comercial
          const finalConAjustes = baseCalibrada * multiplicadorFinal;

          // persistimos en ProyeccionResultado
          // asumimos columnas:
          //   fecha (DATE)
          //   sucursal_id (INT)
          //   sucursal_nombre (STRING)
          //   proyeccion_base (NUMERIC)
          //   proyeccion_final (NUMERIC)
          //   ajustes_aplicados (JSON)
          //   lote_calculo_id (BIGINT)
          const filaGuardada = await ProyeccionResultado.create({
            fecha: fechaStr,
            sucursal_id: sucId,
            sucursal_nombre:
              sucursalNombreMap[String(sucId)] ||
              `Sucursal ${sucId}`,
            proyeccion_base: baseCalibrada,
            proyeccion_final: finalConAjustes,
            ajustes_aplicados: detalles,
            lote_calculo_id,
          });

          // también la sumamos al array de respuesta
          respuestaFinal.push({
            fecha: filaGuardada.fecha,
            sucursal_id: filaGuardada.sucursal_id,
            sucursal_nombre: filaGuardada.sucursal_nombre,
            proyeccion_base: Number(filaGuardada.proyeccion_base),
            proyeccion_final: Number(filaGuardada.proyeccion_final),
            ajustes_aplicados: filaGuardada.ajustes_aplicados || [],
            lote_calculo_id: filaGuardada.lote_calculo_id,
          });
        }
      }

      // 8) Ordenamos la respuesta por fecha y sucursal
      respuestaFinal.sort((a, b) => {
        if (a.fecha < b.fecha) return -1;
        if (a.fecha > b.fecha) return 1;
        return Number(a.sucursal_id) - Number(b.sucursal_id);
      });

      // 9) Devolvemos al frontend
      return res.json(respuestaFinal);
    } catch (err) {
      console.error("Error en calcularProyeccion:", err);
      return res.status(500).json({
        error:
          "No se pudo calcular la proyección (motor ML no respondió correctamente)",
      });
    }
  },
};
