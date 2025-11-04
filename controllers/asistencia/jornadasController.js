// controllers/asistencia/jornadasController.js
import { Op } from 'sequelize';
import { sequelize } from '../../config/database.js';
import Jornada from '../../models/asistencia/jornadaModel.js';
import { Turno } from '../../models/asistencia/Turno.js';
import JornadaTurno from '../../models/asistencia/jornadaTurnoModel.js';

/**
 * Normaliza array de turnos recibidos:
 * Cada item puede venir como:
 *  - { turno_id, dia_semana, vigente_desde, vigente_hasta, activo, orden }
 *  - { turno: { nombre, hora_entrada, hora_salida, tolerancia_min }, ...campos pivote }
 */
function normalizeTurnoInput(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.map((x) => ({
    turno_id: x.turno_id ?? null,
    turno: x.turno ?? null,
    dia_semana: x.dia_semana ?? null,         // 1..7 o null
    vigente_desde: x.vigente_desde ?? null,   // ISO o null
    vigente_hasta: x.vigente_hasta ?? null,   // ISO o null
    activo: x.activo == null ? true : !!x.activo,
    orden: x.orden ?? 0,
  }));
}

/** GET /jornadas */
export async function list(req, res, next) {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 50);
    const offset = (page - 1) * limit;
    const q = (req.query.q || '').trim();

    const where = {};
    if (q) where.nombre = { [Op.iLike]: `%${q}%` };

    const { rows, count } = await Jornada.findAndCountAll({
      where,
      order: [['id', 'ASC']],
      limit, offset,
      include: [{
        model: Turno,
        as: 'turnos',
        through: {
          attributes: ['dia_semana', 'vigente_desde', 'vigente_hasta', 'activo', 'orden']
        },
        order: [[JornadaTurno, 'orden', 'ASC']]
      }]
    });

    res.json({ items: rows, page, limit, total: count });
  } catch (err) { next(err); }
}

/** GET /jornadas/:id */
export async function getById(req, res, next) {
  try {
    const item = await Jornada.findByPk(req.params.id, {
      include: [{
        model: Turno,
        as: 'turnos',
        through: {
          attributes: ['dia_semana', 'vigente_desde', 'vigente_hasta', 'activo', 'orden']
        },
        order: [[JornadaTurno, 'orden', 'ASC']]
      }]
    });
    if (!item) return res.status(404).json({ error: 'not_found' });
    res.json(item);
  } catch (err) { next(err); }
}

/** POST /jornadas
 * body: { nombre, turnos: [ { turno_id? | turno:{...}, dia_semana?, vigente_desde?, ... } ] }
 */
export async function create(req, res, next) {
  const t = await sequelize.transaction();
  try {
    const { nombre, turnos = [] } = req.body || {};
    if (!nombre?.trim()) {
      await t.rollback();
      return res.status(400).json({ error: 'nombre requerido' });
    }

    const jornada = await Jornada.create({ nombre: nombre.trim() }, { transaction: t });

    const items = normalizeTurnoInput(turnos);
    for (const it of items) {
      let turnoId = it.turno_id;
      if (!turnoId && it.turno) {
        const nuevo = await Turno.create(it.turno, { transaction: t });
        turnoId = nuevo.id;
      }
      if (!turnoId) continue;

      await JornadaTurno.create({
        jornada_id: jornada.id,
        turno_id: turnoId,
        dia_semana: it.dia_semana ?? null,
        vigente_desde: it.vigente_desde ? new Date(it.vigente_desde) : null,
        vigente_hasta: it.vigente_hasta ? new Date(it.vigente_hasta) : null,
        activo: it.activo ?? true,
        orden: it.orden ?? 0,
      }, { transaction: t });
    }

    await t.commit();
    // devolver expandido
    const full = await Jornada.findByPk(jornada.id, {
      include: [{
        model: Turno,
        as: 'turnos',
        through: { attributes: ['dia_semana', 'vigente_desde', 'vigente_hasta', 'activo', 'orden'] }
      }]
    });
    res.status(201).json(full);
  } catch (err) {
    await t.rollback();
    next(err);
  }
}

/** PUT /jornadas/:id
 * body: { nombre?, turnos? }  (Si se envía turnos, se REEMPLAZA el set)
 */
export async function update(req, res, next) {
  const t = await sequelize.transaction();
  try {
    const jornada = await Jornada.findByPk(req.params.id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!jornada) { await t.rollback(); return res.status(404).json({ error: 'not_found' }); }

    const { nombre, turnos } = req.body || {};

    if (nombre != null) {
      await jornada.update({ nombre: String(nombre).trim() }, { transaction: t });
    }

    // Si se envía "turnos", reemplazamos TODO el set de la pivote:
    if (Array.isArray(turnos)) {
      // borrar los existentes
      await JornadaTurno.destroy({ where: { jornada_id: jornada.id }, transaction: t });

      const items = normalizeTurnoInput(turnos);
      for (const it of items) {
        let turnoId = it.turno_id;
        if (!turnoId && it.turno) {
          const nuevo = await Turno.create(it.turno, { transaction: t });
          turnoId = nuevo.id;
        }
        if (!turnoId) continue;

        await JornadaTurno.create({
          jornada_id: jornada.id,
          turno_id: turnoId,
          dia_semana: it.dia_semana ?? null,
          vigente_desde: it.vigente_desde ? new Date(it.vigente_desde) : null,
          vigente_hasta: it.vigente_hasta ? new Date(it.vigente_hasta) : null,
          activo: it.activo ?? true,
          orden: it.orden ?? 0,
        }, { transaction: t });
      }
    }

    await t.commit();

    const full = await Jornada.findByPk(jornada.id, {
      include: [{
        model: Turno,
        as: 'turnos',
        through: { attributes: ['dia_semana', 'vigente_desde', 'vigente_hasta', 'activo', 'orden'] }
      }]
    });
    res.json(full);
  } catch (err) {
    await t.rollback();
    next(err);
  }
}

/** DELETE /jornadas/:id */
export async function remove(req, res, next) {
  const t = await sequelize.transaction();
  try {
    const jornada = await Jornada.findByPk(req.params.id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!jornada) { await t.rollback(); return res.status(404).json({ error: 'not_found' }); }

    await JornadaTurno.destroy({ where: { jornada_id: jornada.id }, transaction: t });
    await jornada.destroy({ transaction: t });

    await t.commit();
    res.json({ ok: true });
  } catch (err) {
    await t.rollback();
    next(err);
  }
}

/** GET /jornadas/:id/turnos -> lista los turnos con metadata pivote */
export async function listTurnos(req, res, next) {
  try {
    const jornada = await Jornada.findByPk(req.params.id);
    if (!jornada) return res.status(404).json({ error: 'not_found' });

    const rows = await JornadaTurno.findAll({
      where: { jornada_id: jornada.id },
      include: [{ model: Turno, as: 'turno' }],
      order: [['orden', 'ASC'], ['id', 'ASC']],
    });

    res.json({ items: rows });
  } catch (err) { next(err); }
}

/** POST /jornadas/:id/turnos -> agrega un turno (crea si no existe) con metadata pivote */
export async function addTurno(req, res, next) {
  const t = await sequelize.transaction();
  try {
    const jornada = await Jornada.findByPk(req.params.id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!jornada) { await t.rollback(); return res.status(404).json({ error: 'not_found' }); }

    const [it] = normalizeTurnoInput([req.body || {}]);
    if (!it) { await t.rollback(); return res.status(400).json({ error: 'payload_invalido' }); }

    let turnoId = it.turno_id;
    if (!turnoId && it.turno) {
      const nuevo = await Turno.create(it.turno, { transaction: t });
      turnoId = nuevo.id;
    }
    if (!turnoId) { await t.rollback(); return res.status(400).json({ error: 'turno_id_requerido' }); }

    const link = await JornadaTurno.create({
      jornada_id: jornada.id,
      turno_id: turnoId,
      dia_semana: it.dia_semana ?? null,
      vigente_desde: it.vigente_desde ? new Date(it.vigente_desde) : null,
      vigente_hasta: it.vigente_hasta ? new Date(it.vigente_hasta) : null,
      activo: it.activo ?? true,
      orden: it.orden ?? 0,
    }, { transaction: t });

    await t.commit();
    res.status(201).json(link);
  } catch (err) {
    await t.rollback();
    next(err);
  }
}

/** DELETE /jornadas/:id/turnos/:turnoId -> desasocia un turno */
export async function removeTurno(req, res, next) {
  const t = await sequelize.transaction();
  try {
    const jornadaId = Number(req.params.id);
    const turnoId = Number(req.params.turnoId);

    const link = await JornadaTurno.findOne({
      where: { jornada_id: jornadaId, turno_id: turnoId },
      transaction: t, lock: t.LOCK.UPDATE
    });
    if (!link) { await t.rollback(); return res.status(404).json({ error: 'not_found' }); }

    await link.destroy({ transaction: t });
    await t.commit();
    res.json({ ok: true });
  } catch (err) {
    await t.rollback();
    next(err);
  }
}
