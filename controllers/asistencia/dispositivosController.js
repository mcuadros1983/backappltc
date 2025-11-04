import { Op } from 'sequelize';
import Sucursal from "../../models/gmedias/sucursalModel.js";
import { Dispositivo } from '../../models/asistencia/Dispositivo.js';

export async function list(req, res, next) {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 100);
    const offset = (page - 1) * limit;

    const where = {};
    if (req.query.enabled !== undefined) where.enabled = req.query.enabled === 'true';
    if (req.query.sucursal_id) where.sucursal_id = Number(req.query.sucursal_id);
    if (req.query.q) {
      const q = `%${req.query.q}%`;
      where[Op.or] = [
        { nombre: { [Op.iLike]: q } },
        { device_id: { [Op.iLike]: q } },
      ];
    }

    const { rows, count } = await Dispositivo.findAndCountAll({
      where,
      include: [{ model: Sucursal, as: 'sucursal' }],
      order: [['id', 'ASC']],
      limit,
      offset
    });
    res.json({ items: rows, page, limit, total: count });
  } catch (err) { next(err); }
}

export async function getById(req, res, next) {
  try {
    const item = await Dispositivo.findByPk(req.params.id);
    if (!item) return res.status(404).json({ error: 'not_found' });
    res.json(item);
  } catch (err) { next(err); }
}

export async function create(req, res, next) {
  try {
    const item = await Dispositivo.create(req.body);
    res.status(201).json(item);
  } catch (err) { next(err); }
}

export async function update(req, res, next) {
  try {
    const item = await Dispositivo.findByPk(req.params.id);
    if (!item) return res.status(404).json({ error: 'not_found' });
    await item.update(req.body);
    res.json(item);
  } catch (err) { next(err); }
}

export async function remove(req, res, next) {
  try {
    const item = await Dispositivo.findByPk(req.params.id);
    if (!item) return res.status(404).json({ error: 'not_found' });
    await item.destroy();
    res.json({ ok: true });
  } catch (err) { next(err); }
}
