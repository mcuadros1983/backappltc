import { Parametro } from '../../models/asistencia/Parametro.js';

export async function getAll(req, res, next) {
  try {
    const rows = await Parametro.findAll();
    const out = {};
    for (const p of rows) out[p.clave] = p.valor;
    res.json(out);
  } catch (err) { next(err); }
}

export async function upsertMany(req, res, next) {
  try {
    const body = req.body || {};
    const keys = Object.keys(body);
    for (const k of keys) {
      const valor = body[k];
      const existing = await Parametro.findOne({ where: { clave: k } });
      if (existing) await existing.update({ valor });
      else await Parametro.create({ clave: k, valor });
    }
    res.json({ ok: true, updated: keys.length });
  } catch (err) { next(err); }
}
