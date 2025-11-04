
import { buildEmbeddingsSnapshot, serializeAndSignSnapshot } from '../../services/embeddingsSnapshot.js';
import { EmpleadoEmbedding } from '../../models/asistencia/EmpleadoEmbedding.js';
import Empleado from "../../models/tablas/empleadoModel.js";

/** Util interno para parsear booleanos desde query */
function parseBool(v) {
  return String(v).toLowerCase() === 'true';
}

// GET /embeddings/snapshot?sucursal_id=1&since=2025-09-01T00:00:00Z&metaOnly=true
export async function getSnapshot(req, res, next) {
  try {
    const { sucursal_id, since, metaOnly } = req.query;

    const snap = await buildEmbeddingsSnapshot({
      sucursalId: sucursal_id ? Number(sucursal_id) : null,
      updatedSince: since || null,
    });

    if (parseBool(metaOnly)) {
      return res.json(snap.meta);
    }

    const payload = { meta: snap.meta, items: snap.items };
    const { gz, signature, etag, contentLength } = serializeAndSignSnapshot(payload);

    // Soporte de cache condicional
    const inm = req.headers['if-none-match'];
    if (inm && inm === etag) {
      return res.status(304).end();
    }

    // res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Encoding', 'gzip');
    res.setHeader('Content-Length', contentLength.toString());
    res.setHeader('X-Snapshot-Signature', signature);
    res.setHeader('ETag', etag);

    // Cacheo opcional (según env)
    const maxAge = process.env.SNAPSHOT_MAX_AGE
      ? Number(process.env.SNAPSHOT_MAX_AGE)
      : 0; // segundos
    if (maxAge > 0) {
      res.setHeader('Cache-Control', `public, max-age=${maxAge}`);
    }

    return res.send(gz);
  } catch (err) {
    next(err);
  }
}

// POST /embeddings/:empleadoId
// body: { vectors: number[][], dim?: 128|512, fuente?: 'mobile' }
// controllers/embeddingsController.js
export async function postEmployeeEmbeddings(req, res, next) {
  try {
    const empleado_id = Number(req.params.empleadoId);
    const { vectors, dim: dimFromBody, fuente = 'mobile-flutter' } = req.body || {};

    console.log('POST /embeddings/%s', req.params.empleadoId, {
      dimFromBody, inferredDim: vectors?.[0]?.length, count: vectors?.length
    });


    if (!empleado_id) {
      return res.status(400).json({ error: 'empleado_id inválido (en la URL)' });
    }
    if (!Array.isArray(vectors) || vectors.length === 0 || !Array.isArray(vectors[0])) {
      return res.status(400).json({ error: 'vectors requerido (array de arrays)' });
    }

    // 1) Inferir dimensión real del primer vector
    const inferredDim = Array.isArray(vectors[0]) ? vectors[0].length : undefined;
    if (!inferredDim || inferredDim <= 0) {
      return res.status(400).json({ error: 'No se pudo inferir la dimensión de embeddings' });
    }

    // 2) Si vino dim en el body y no coincide, avisar pero continuar usando la real
    if (dimFromBody && dimFromBody !== inferredDim) {
      // Podés loguearlo; no lo tomamos como error fatal
      console.warn(`[embeddings] dim body=${dimFromBody} != inferred=${inferredDim}; usando ${inferredDim}`);
    }

    // 3) Validar consistencia
    for (const v of vectors) {
      if (!Array.isArray(v) || v.length !== inferredDim) {
        return res.status(400).json({ error: `Todos los vectores deben tener dimensión ${inferredDim}` });
      }
      // Opcional: validar que sean numéricos
      // if (v.some(x => typeof x !== 'number' || !Number.isFinite(x))) { ... }
    }

    // 4) Verificar empleado
    const emp = await Empleado.findByPk(empleado_id);
    if (!emp) return res.status(404).json({ error: 'Empleado no existe' });

    // 5) Guardar
    const rows = await Promise.all(
      vectors.map(v => EmpleadoEmbedding.create({
        empleado_id,
        vector: v,
        dim: inferredDim,
        fuente,
        activo: true
      }))
    );

    return res.status(201).json({ created: rows.length, dim: inferredDim });
  } catch (err) {
    next(err);
  }
}
