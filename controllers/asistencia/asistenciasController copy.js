import { Op, UniqueConstraintError } from 'sequelize';
import { Asistencia } from '../../models/asistencia/Asistencia.js';
import Empleado from "../../models/tablas/empleadoModel.js";
import Sucursal from "../../models/gmedias/sucursalModel.js";
import { Dispositivo } from '../../models/asistencia/Dispositivo.js';
import { Parametro } from '../../models/asistencia/Parametro.js';

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

export async function create(req, res, next) {
  try {
    const idemKey = req.get('Idempotency-Key') || req.get('X-Idempotency-Key');
    const deviceId = req.get('X-Device-Id');
    const apiKey = req.get('X-API-Key');

    if (!idemKey || !deviceId || !apiKey) {
      return res.status(401).json({ error: 'missing_headers' });
    }

    // Validar dispositivo + api_key
    const dev = await Dispositivo.findOne({ where: { device_id: deviceId, api_key: apiKey, enabled: true }, include: [{ model: Sucursal, as: 'sucursal' }] });
    if (!dev) return res.status(403).json({ error: 'device_not_allowed' });

    // Idempotencia: si ya existe, devolvemos el mismo resultado
    const existing = await Asistencia.findOne({ where: { idem_key: idemKey } });
    if (existing) return res.status(200).json({ ok: true, id: existing.id, duplicated: true });

    const {
      empleado_id, sucursal_id, score, liveness_passed, metodo,
      ts_utc, lat, lon, turno_id
    } = req.body || {};

    if (!empleado_id || !sucursal_id || !ts_utc) {
      return res.status(400).json({ error: 'invalid_payload' });
    }

    // Geofence (si hay coordenadas y sucursal tiene lat/lon)
    if (lat != null && lon != null && dev.sucursal?.lat != null && dev.sucursal?.lon != null) {
      // preferir radio de sucursal; si no, usar parametro global
      const pGeofence = await Parametro.findOne({ where: { clave: 'geofence_m' } });
      const limitM = dev.sucursal?.radio_m || Number(pGeofence?.valor || 0);
      if (limitM > 0) {
        const d = distM(lat, lon, dev.sucursal.lat, dev.sucursal.lon);
        if (d != null && d > limitM) {
          return res.status(409).json({ error: 'geofence_failed', distance_m: Math.round(d), limit_m: limitM });
        }
      }
    }

    // Dedup por ventana (mismo empleado en N minutos)
    const pVentana = await Parametro.findOne({ where: { clave: 'ventana_min_repeticion' } });
    const minutes = Number(pVentana?.valor || 0);
    if (minutes > 0) {
      const t = new Date(ts_utc);
      const from = new Date(t.getTime() - minutes * 60 * 1000);
      const last = await Asistencia.findOne({
        where: {
          empleado_id,
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
      device_id: deviceId,
      metodo: metodo || 'facial',
      score: score ?? null,
      liveness_passed: !!liveness_passed,
      ts_utc: new Date(ts_utc),
      lat: lat ?? null,
      lon: lon ?? null,
      idem_key: idemKey,
      turno_id: turno_id ?? null
    });

    res.status(201).json({ ok: true, id: item.id });
  } catch (err) { next(err); }
}

export async function createAsistencia(req, res, next) {
  try {
    const { empleado_id, sucursal_id, device_id, metodo, score, liveness_passed,
      ts_utc, lat, lon, turno_id } = req.body || {};

    if (!empleado_id || !sucursal_id || !device_id) {
      return res.status(400).json({ error: 'empleado_id, sucursal_id y device_id son obligatorios' });
    }

    // Normaliza device_id (defensa en profundidad)
    const normDeviceId = normalizeDeviceId(device_id);

    // (Opcional) valida que la sucursal exista para evitar 23503 si tienes FK:
    const suc = await Sucursal.findByPk(Number(sucursal_id));
    if (!suc) {
      return res.status(400).json({ error: 'sucursal_id no existe' });
    }


    // (Opcional) Chequear geocerca si hay lat/lon y la sucursal tiene radio definido
    // (Opcional) Validar score mínimo usando Parametro.THRESHOLD si querés forzar en backend.

    const idem = req.headers['x-idempotency-key'] || null;
    // upsert por (idem) si lo manejás en una tabla de idempotencia o unique index
    // ...

    const row = await Asistencia.create({
      empleado_id,
      sucursal_id,
      device_id: normDeviceId,             // 👈 guardamos normalizado
      metodo: metodo || 'facial-onnx',
      score: score ?? null,
      liveness_passed: !!liveness_passed,
      ts_utc: ts_utc ? new Date(ts_utc) : new Date(),
      lat: lat ?? null,
      lon: lon ?? null,
      turno_id: turno_id ?? null,
    });

    return res.status(201).json({ id: row.id });
  } catch (err) {
    next(err);
  }
}
