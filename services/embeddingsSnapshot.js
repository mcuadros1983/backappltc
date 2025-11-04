// services/embeddingsSnapshot.js
import zlib from 'zlib';
import { Op } from 'sequelize';
import crypto from 'crypto';
import { EmpleadoEmbedding } from '../models/asistencia/EmpleadoEmbedding.js';
import Empleado from '../models/tablas/empleadoModel.js';

/**
 * Arma el snapshot: items = [{ empleado_id, vectors: number[][] }]
 * Filtros:
 *  - sucursalId: limita a empleados de esa sucursal
 *  - updatedSince: sólo embeddings con updatedAt >= fecha (ISO)
 */
export async function buildEmbeddingsSnapshot({ sucursalId = null, updatedSince = null } = {}) {
  const whereEmp = {};
  if (sucursalId) whereEmp.sucursal_id = sucursalId;

  const whereEmb = { activo: true };
  if (updatedSince) whereEmb.updatedAt = { [Op.gte]: new Date(updatedSince) };

  const rows = await EmpleadoEmbedding.findAll({
    include: [
      {
        model: Empleado,
        where: whereEmp,
        required: true,
        attributes: ['id'], // minimiza carga
      },
    ],
    where: whereEmb,
    attributes: ['empleado_id', 'vector', 'dim', 'updatedAt'],
    order: [
      ['empleado_id', 'ASC'],
      ['updatedAt', 'ASC'],
    ],
  });

  const map = new Map(); // empleado_id -> vectors[]
  let dim = null;
  for (const r of rows) {
    if (!dim && r.dim) dim = r.dim;
    const arr = map.get(r.empleado_id) || [];
    arr.push(r.vector);
    map.set(r.empleado_id, arr);
  }

  const items = [...map.entries()].map(([empleado_id, vectors]) => ({
    empleado_id,
    vectors,
  }));

  const meta = {
    count_empleados: items.length,
    count_vectores: rows.length,
    model: 'mobilefacenet-tflite', // referencia/etiqueta
    dim: dim || 128,
    generated_at: new Date().toISOString(),
    sucursal_id: sucursalId || null,
    updated_since: updatedSince || null,
  };

  return { items, meta };
}

/**
 * Serializa, comprime (gzip), firma (HMAC-SHA256 base64) y calcula ETag.
 * - SNAPSHOT_SECRET (env) se usa para HMAC. Si no está, firma con 'default-secret' (no recomendado).
 */
export function serializeAndSignSnapshot(obj) {
  const jsonBuffer = Buffer.from(JSON.stringify(obj), 'utf8');
  const gz = zlib.gzipSync(jsonBuffer, { level: 6 });

  const secret = process.env.SNAPSHOT_SECRET || 'default-secret';
  const signature = hmacSha256Base64(gz, secret);

  // ETag simple sobre JSON sin comprimir (para If-None-Match)
  const etag = sha1Base64(jsonBuffer);

  return { gz, signature, etag, contentLength: gz.length };
}

function hmacSha256Base64(bufferOrString, secret) {
  return crypto.createHmac('sha256', secret).update(bufferOrString).digest('base64');
}

function sha1Base64(bufferOrString) {
  return crypto.createHash('sha1').update(bufferOrString).digest('base64');
}
