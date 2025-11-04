import { Op } from 'sequelize';
import { Turno } from '../../models/asistencia/Turno.js';

export async function list(req, res, next) {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 100);
    const offset = (page - 1) * limit;

    const where = {};
    if (req.query.q) {
      const q = `%${req.query.q}%`;
      where.nombre = { [Op.iLike]: q };
    }

    const { rows, count } = await Turno.findAndCountAll({
      where,
      order: [['id', 'ASC']],
      limit,
      offset
    });
    console.log("rows", rows)
    res.json({ items: rows, page, limit, total: count });
  } catch (err) { next(err); }
}

export async function getById(req, res, next) {
  try {
    const item = await Turno.findByPk(req.params.id);
    if (!item) return res.status(404).json({ error: 'not_found' });
    res.json(item);
  } catch (err) { next(err); }
}

export async function create(req, res, next) {
  try {
    const item = await Turno.create(req.body);
    res.status(201).json(item);
  } catch (err) { next(err); }
}

export async function update(req, res, next) {
  try {
    const item = await Turno.findByPk(req.params.id);
    if (!item) return res.status(404).json({ error: 'not_found' });
    await item.update(req.body);
    res.json(item);
  } catch (err) { next(err); }
}

export async function remove(req, res, next) {
  try {
    const item = await Turno.findByPk(req.params.id);
    if (!item) return res.status(404).json({ error: 'not_found' });
    await item.destroy();
    res.json({ ok: true });
  } catch (err) { next(err); }
}
