import { Op, UniqueConstraintError } from 'sequelize';
import { Asistencia } from '../../models/asistencia/Asistencia.js';
import Empleado from "../../models/tablas/empleadoModel.js";
import Sucursal from "../../models/gmedias/sucursalModel.js";
import { Dispositivo } from '../../models/asistencia/Dispositivo.js';
import { Parametro } from '../../models/asistencia/Parametro.js';
import DatosEmpleado from '../../models/tablas/datosEmpleadoModel.js';
import Jornada from '../../models/asistencia/jornadaModel.js';
import { Turno } from '../../models/asistencia/Turno.js';
import JornadaTurno from '../../models/asistencia/jornadaTurnoModel.js';
import {  getExpectedForRecord } from '../../utils/getExpectedForRecord.js';

// --- Constantes / helpers ---
const VALID_CONCEPTS = ['INGRESO', 'EGRESO'];

// Haversine (metros)
function distM(lat1, lon1, lat2, lon2) {
  if ([lat1, lon1, lat2, lon2].some(v => v == null)) return null;
  const R = 6371000;
  const toRad = (d) => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Normaliza como en Flutter: trim, lower, quita prefijo "android-"
function normalizeDeviceId(raw) {
  if (!raw) return null;
  let s = String(raw).trim().toLowerCase();
  if (s.startsWith('android-')) s = s.substring('android-'.length);
  return s;
}



// --- Listado ---
export async function list(req, res, next) {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 50);
    const offset = (page - 1) * limit;

    const where = {};
    if (req.query.desde) where.ts_utc = { [Op.gte]: new Date(req.query.desde) };
    if (req.query.hasta) {
      where.ts_utc = where.ts_utc || {};
      where.ts_utc[Op.lte] = new Date(req.query.hasta + 'T23:59:59.999Z');
    }
    if (req.query.empleado_id) where.empleado_id = Number(req.query.empleado_id);
    if (req.query.sucursal_id) where.sucursal_id = Number(req.query.sucursal_id);
    if (req.query.turno_id) where.turno_id = Number(req.query.turno_id);

    // NEW: filtro por concepto (INGRESO | EGRESO)
    if (req.query.operation_concept) {
      const c = String(req.query.operation_concept).toUpperCase();
      if (VALID_CONCEPTS.includes(c)) where.operation_concept = c;
    }

    const { rows, count } = await Asistencia.findAndCountAll({
      where,
      include: [
        { model: Empleado, as: 'Empleadotabla' },
        { model: Sucursal, as: 'Sucursal' }
      ],
      order: [['ts_utc', 'DESC']],
      limit,
      offset
    });
    res.json({ items: rows, page, limit, total: count });
  } catch (err) { next(err); }
}

export async function listDetallado(req, res, next) {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 50);
    const offset = (page - 1) * limit;

    const where = {};
    if (req.query.desde) {
      where.ts_utc = { [Op.gte]: new Date(req.query.desde) };
    }
    if (req.query.hasta) {
      where.ts_utc = where.ts_utc || {};
      where.ts_utc[Op.lte] = new Date(req.query.hasta + 'T23:59:59.999Z');
    }
    if (req.query.empleado_id) where.empleado_id = Number(req.query.empleado_id);
    if (req.query.sucursal_id) where.sucursal_id = Number(req.query.sucursal_id);

    const { rows, count } = await Asistencia.findAndCountAll({
      where,
      include: [
        { model: Empleado, as: 'Empleadotabla' },
        { model: Sucursal, as: 'Sucursal' },
      ],
      order: [['ts_utc', 'DESC']],
      limit,
      offset,
    });

    const enriched = [];

    for (const a of rows) {
      const concepto = a.operation_concept ?? null; // 'INGRESO' | 'EGRESO'
      const ts = new Date(a.ts_utc);

      console.log("\n========================================");
      console.log("🧾 Procesando asistencia ID:", a.id);
      console.log("Empleado:", a.empleado_id, "| Concepto:", concepto);
      console.log("Fecha UTC:", a.ts_utc);

      // 🔴 AHORA LE PASAMOS concept AL HELPER
      const expected = await getExpectedForRecord(
        a.empleado_id,
        a.ts_utc,
        concepto
      );

      console.log("→ Resultado esperado:", expected);

      let expectedTime = null;
      let calc = { deltaMin: null, deltaHHMMSS: null, expectedTime: null };

      if (expected) {
        // según concepto, usamos horaEntrada u horaSalida
        const isIngreso = concepto === 'INGRESO';
        const horaEsperada = isIngreso
          ? expected.horaEntrada
          : expected.horaSalida;

        console.log("Hora esperada calculada:", horaEsperada);

        // diffInfo: usá la misma función que ya tenés implementada
        calc = diffInfo(ts, horaEsperada, isIngreso);
        expectedTime = horaEsperada;
      } else {
        console.log("⚠️ No se encontró turno esperado para esta marca");
      }

      enriched.push({
        id: a.id,

        empleado_id: a.empleado_id,
        empleado_apellido: a.Empleadotabla?.apellido,
        empleado_nombre: a.Empleadotabla?.nombre,

        sucursal_id: a.sucursal_id,
        sucursal_nombre: a.Sucursal?.nombre,

        ts_utc: a.ts_utc,
        device_id: a.device_id,
        metodo: a.metodo,
        score: a.score,
        liveness_passed: a.liveness_passed,
        lat: a.lat,
        lon: a.lon,

        operation_concept: concepto,
        jornada_nombre: expected?.jornadaNombre || null,
        turno_nombre: expected?.turnoNombre   || null,
        expected_time: expectedTime,

        delta_min: calc.deltaMin,
        delta_hhmmss: calc.deltaHHMMSS,
      });

      console.log("✅ Enriquecido final:", {
        turno: expected?.turnoNombre,
        expected_time: expectedTime,
        delta_hhmmss: calc.deltaHHMMSS,
      });
      console.log("========================================\n");
    }

    res.json({
      items: enriched,
      page,
      limit,
      total: count,
    });
  } catch (err) {
    console.error("💥 Error en listDetallado:", err);
    next(err);
  }
}


// --- Crear vía headers con idempotencia y validaciones de dispositivo ---
export async function create(req, res, next) {
  try {
    const idemKey = req.get('Idempotency-Key') || req.get('X-Idempotency-Key');
    const deviceIdHdr = req.get('X-Device-Id');
    const apiKey = req.get('X-API-Key');

    if (!idemKey || !deviceIdHdr || !apiKey) {
      return res.status(401).json({ error: 'missing_headers' });
    }

    // Validar dispositivo + api_key
    const dev = await Dispositivo.findOne({
      where: { device_id: deviceIdHdr, api_key: apiKey, enabled: true },
      include: [{ model: Sucursal, as: 'sucursal' }]
    });
    if (!dev) return res.status(403).json({ error: 'device_not_allowed' });

    // Idempotencia: si ya existe, devolvemos el mismo resultado
    const existing = await Asistencia.findOne({ where: { idempotency_key: idemKey } }); // FIX nombre de campo
    if (existing) return res.status(200).json({ ok: true, id: existing.id, duplicated: true });

    const {
      empleado_id,
      sucursal_id,
      score,
      liveness_passed,
      metodo,
      ts_utc,
      lat,
      lon,
      turno_id,
      operation_concept // NEW
    } = req.body || {};

    if (!empleado_id || !sucursal_id || !ts_utc) {
      return res.status(400).json({ error: 'invalid_payload' });
    }

    // NEW: normalizar y validar concepto
    const concept = (operation_concept || 'INGRESO').toString().toUpperCase();
    if (!VALID_CONCEPTS.includes(concept)) {
      return res.status(400).json({ error: 'invalid_operation_concept', allowed: VALID_CONCEPTS });
    }

    // Geofence (si hay coordenadas y sucursal tiene lat/lon)
    if (lat != null && lon != null && dev.sucursal?.lat != null && dev.sucursal?.lon != null) {
      const pGeofence = await Parametro.findOne({ where: { clave: 'geofence_m' } });
      const limitM = dev.sucursal?.radio_m || Number(pGeofence?.valor || 0);
      if (limitM > 0) {
        const d = distM(lat, lon, dev.sucursal.lat, dev.sucursal.lon);
        if (d != null && d > limitM) {
          return res.status(409).json({ error: 'geofence_failed', distance_m: Math.round(d), limit_m: limitM });
        }
      }
    }

    // Dedup por ventana (mismo empleado y mismo concepto en N minutos)
    const pVentana = await Parametro.findOne({ where: { clave: 'ventana_min_repeticion' } });
    const minutes = Number(pVentana?.valor || 0);
    if (minutes > 0) {
      const t = new Date(ts_utc);
      const from = new Date(t.getTime() - minutes * 60 * 1000);
      const last = await Asistencia.findOne({
        where: {
          empleado_id,
          operation_concept: concept, // NEW: dedup por concepto
          ts_utc: { [Op.gte]: from, [Op.lte]: t }
        },
        order: [['ts_utc', 'DESC']]
      });
      if (last) {
        return res.status(200).json({ ok: true, id: last.id, dedup_window: true });
      }
    }

    // Crear registro
    const item = await Asistencia.create({
      empleado_id,
      sucursal_id,
      device_id: normalizeDeviceId(deviceIdHdr),
      metodo: metodo || 'facial',
      score: score ?? null,
      liveness_passed: !!liveness_passed,
      ts_utc: new Date(ts_utc),
      lat: lat ?? null,
      lon: lon ?? null,
      idempotency_key: idemKey,   // FIX nombre de campo
      turno_id: turno_id ?? null,
      operation_concept: concept  // NEW
    });

    res.status(201).json({ ok: true, id: item.id });
  } catch (err) { next(err); }
}

// --- Crear directa (body), útil para integraciones internas ---
export async function createAsistencia(req, res, next) {
  const tag = '[createAsistencia]';
  try {
    console.log(`${tag} ⇢ INICIO`);
    console.log(`${tag} headers:`, {
      'Idempotency-Key': req.get('Idempotency-Key'),
      'X-Idempotency-Key': req.get('X-Idempotency-Key'),
      'X-Device-Id': req.get('X-Device-Id'),
      'content-type': req.get('content-type'),
    });

    console.log(`${tag} raw body:`, req.body);

    const {
      empleado_id,
      sucursal_id,
      device_id,
      metodo,
      score,
      liveness_passed,
      ts_utc,
      lat,
      lon,
      turno_id,
      operation_concept // NEW
    } = req.body || {};

    // Validaciones mínimas
    if (!empleado_id || !sucursal_id || !device_id) {
      console.log(`${tag} ❌ faltan campos obligatorios`, {
        empleado_id, sucursal_id, device_id
      });
      return res.status(400).json({ error: 'empleado_id, sucursal_id y device_id son obligatorios' });
    }
    console.log(`${tag} ✓ payload básico OK`);

    // Normaliza device_id
    const normDeviceId = normalizeDeviceId(device_id);
    console.log(`${tag} device_id(normalizado):`, normDeviceId);

    // Verifica sucursal
    const sucIdNum = Number(sucursal_id);
    console.log(`${tag} buscando sucursal`, { sucursal_id: sucIdNum });
    const suc = await Sucursal.findByPk(sucIdNum);
    if (!suc) {
      console.log(`${tag} ❌ sucursal no existe`, { sucursal_id: sucIdNum });
      return res.status(400).json({ error: 'sucursal_id no existe' });
    }
    console.log(`${tag} ✓ sucursal encontrada`, { id: suc.id });

    // Normaliza y valida concepto
    const concept = (operation_concept || 'INGRESO').toString().toUpperCase();
    console.log(`${tag} operation_concept(normalizado):`, concept);
    if (!VALID_CONCEPTS.includes(concept)) {
      console.log(`${tag} ❌ concepto inválido`, { concept, allowed: VALID_CONCEPTS });
      return res.status(400).json({ error: 'invalid_operation_concept', allowed: VALID_CONCEPTS });
    }
    console.log(`${tag} ✓ concepto OK`);

    // Idempotencia
    const idem =
      req.get('Idempotency-Key') ||
      req.get('X-Idempotency-Key') ||
      req.headers['x-idempotency-key'] ||
      null;
    console.log(`${tag} idempotency_key:`, idem);

    if (idem) {
      const prev = await Asistencia.findOne({ where: { idempotency_key: idem } });
      console.log(`${tag} búsqueda por idempotencia`, { found: !!prev });
      if (prev) {
        console.log(`${tag} ✓ idempotente (ya existe)`, { id: prev.id });
        return res.status(200).json({ id: prev.id, duplicated: true });
      }
    }

    // Construir payload final
    const payload = {
      empleado_id: Number(empleado_id),
      sucursal_id: sucIdNum,
      device_id: normDeviceId,
      metodo: metodo || 'facial-onnx',
      score: (score ?? null),
      liveness_passed: !!liveness_passed,
      ts_utc: ts_utc ? new Date(ts_utc) : new Date(),
      lat: lat ?? null,
      lon: lon ?? null,
      turno_id: turno_id ?? null,
      operation_concept: concept,
      idempotency_key: idem || null,
    };
    console.log(`${tag} payload a crear:`, payload);

    const row = await Asistencia.create(payload);
    console.log(`${tag} ✓ creado`, { id: row.id });

    return res.status(201).json({ id: row.id });
  } catch (err) {
    // Log detallado del error
    console.error('[createAsistencia] ❌ ERROR:', {
      name: err?.name,
      message: err?.message,
      errors: err?.errors,
      stack: err?.stack,
    });

    // Errores comunes de Sequelize (validations / unique / enum)
    if (err?.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'unique_constraint', fields: err?.fields || null });
    }
    if (err?.name === 'SequelizeDatabaseError') {
      // Por ejemplo: error de ENUM si no coincide con los valores permitidos
      return res.status(400).json({ error: 'db_error', detail: err?.original?.detail || err?.message });
    }
    if (err?.name === 'SequelizeValidationError') {
      return res.status(400).json({ error: 'validation_error', detail: err?.errors?.map(e => e.message) });
    }

    return next(err);
  } finally {
    console.log('[createAsistencia] ⇠ FIN');
  }
}


// ---------------------- utils ----------------------

// diferencia en minutos (float) y hh:mm:ss (string con signo)
function diffInfo(actualDate, expectedHHMM, isIngreso) {
  if (!expectedHHMM) {
    return { deltaMin: null, deltaHHMMSS: null, expectedTime: null };
  }

  // expectedHHMM p.ej "08:00"
  const [hhExp, mmExp] = expectedHHMM.split(':').map(Number);
  const expectedLocal = new Date(actualDate);
  expectedLocal.setHours(hhExp ?? 0, mmExp ?? 0, 0, 0);

  // diferencia:
  // - para INGRESO: "llegó tarde" = actual > esperado → diff = actual - esperado
  // - para EGRESO: "se fue antes" = actual < esperado → diff = esperado - actual
  let diffMs;
  if (isIngreso) {
    diffMs = actualDate - expectedLocal;
  } else {
    diffMs = actualDate - expectedLocal;
    // en salida, si actual < esperado => diff negativo (se fue antes)
    // si actual > esperado => diff positivo (se quedó más)
    // esto ya está cubierto con la misma fórmula
  }

  const diffMin = diffMs / 60000.0;
  const sign = diffMin < 0 ? '-' : '';
  const absMin = Math.abs(diffMin);

  const totalSeconds = absMin * 60.0;
  const hh = Math.floor(totalSeconds / 3600);
  const mm = Math.floor((totalSeconds % 3600) / 60);
  const ss = Math.floor(totalSeconds % 60);

  const two = (n) => String(n).padStart(2, '0');

  return {
    deltaMin: Number(diffMin.toFixed(2)),
    deltaHHMMSS: `${sign}${two(hh)}:${two(mm)}:${two(ss)}`,
    expectedTime: expectedHHMM,
  };
}

// dado empleado_id + ts_utc => busca jornada asignada y turno aplicable
// async function getExpectedForRecord(empleadoId, tsUTC) {
//   // 1) obtener DatosEmpleado (para jornada_id)
//   const datos = await DatosEmpleado.findOne({
//     where: { empleado_id: empleadoId },
//     // si en el futuro guardás histórico de jornada_id tendríamos que versionar esto.
//   });
//   if (!datos || !datos.jornada_id) return null;

//   // 2) traer jornada + sus turnos/links
//   const jornada = await Jornada.findByPk(datos.jornada_id, {
//     include: [{
//       model: Turno,
//       as: 'turnos',
//       through: {
//         model: JornadaTurno,
//         attributes: [
//           'dia_semana',
//           'vigente_desde',
//           'vigente_hasta',
//           'activo',
//           'orden'
//         ]
//       }
//     }]
//   });
//   if (!jornada) return null;

//   console.log("jornada encontrada:", jornada);

//   // 3) matchear día_semana y vigencia
//   //    día_semana 1..7 según tu modelo. Vamos a sacar el día local del ts.
//   const ts = new Date(tsUTC);
//   // JS: getUTCDay() 0..6 (0=Dom), necesitamos 1..7 Lun..Dom o lo que uses.
//   // Vos dijiste 1=Lunes..7=Domingo. Vamos a mapear:
//   const dayJS = ts.getUTCDay(); // 0..6
//   const diaSemana = dayJS === 0 ? 7 : dayJS; // 1..7? cuidado: esto hace 0(dom)->7, 1(lun)->1, etc.
//   // Nota: si trabajás horario local y no UTC, acá deberías usar getDay() en lugar de getUTCDay()

//   // definimos función helper para check vigencia
//   const tsMs = ts.getTime();
//   function vigente(link) {
//     const vd = link.vigente_desde ? new Date(link.vigente_desde).getTime() : null;
//     const vh = link.vigente_hasta ? new Date(link.vigente_hasta).getTime() : null;
//     if (vd != null && tsMs < vd) return false;
//     if (vh != null && tsMs > vh) return false;
//     return true;
//   }

//   // jornada.turnos es un array de Turno,
//   // cada uno tiene Turno.JornadaTurno (el registro pivote)
//   // OJO: según cómo definiste las asociaciones, Sequelize mete la data pivote
//   // generalmente en turno.JornadaTurno o turno.jornada_turno, ajustá el nombre
//   // Ahora asumimos que viene como turno.JornadaTurno.
//   let best = null;
//   for (const turno of jornada.turnos || []) {
//     const link = turno.JornadaTurno || turno.jornadaTurno || turno.jornada_turno;
//     if (!link) continue;
//     if (link.activo === false) continue;
//     if (!vigente(link)) continue;

//     // match día_semana exacto si está seteado
//     if (link.dia_semana != null && link.dia_semana !== diaSemana) {
//       continue;
//     }

//     // aplicamos una simple priorización:
//     // menor "orden" gana. Si no hay orden, 0.
//     if (!best) {
//       best = { turno, link };
//     } else {
//       const prevOrder = best.link.orden ?? 0;
//       const thisOrder = link.orden ?? 0;
//       if (thisOrder < prevOrder) {
//         best = { turno, link };
//       }
//     }
//   }

//   if (!best) return null;

//   return {
//     jornadaNombre: jornada.nombre,
//     turnoNombre: best.turno.nombre,
//     horaEntrada: best.turno.hora_entrada, // "08:00"
//     horaSalida: best.turno.hora_salida,   // "17:00"
//     toleranciaMin: best.turno.tolerancia_min ?? 0,
//   };
// }
