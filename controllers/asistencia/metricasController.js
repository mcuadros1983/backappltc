import { Op, fn, col, literal } from 'sequelize';
import { Asistencia } from '../../models/asistencia/Asistencia.js';
import Empleado  from '../../models/tablas/empleadoModel.js';

export async function resumen(req, res, next) {
  try {
    const desde = req.query.desde ? new Date(req.query.desde) : new Date(new Date().getFullYear(), 0, 1);
    const hasta = req.query.hasta ? new Date(req.query.hasta + 'T23:59:59.999Z') : new Date();

    const where = { ts_utc: { [Op.between]: [desde, hasta] } };

    // Serie diaria
    const serie = await Asistencia.findAll({
      attributes: [
        [fn('date_trunc', 'day', col('ts_utc')), 'dia'],
        [fn('count', col('id')), 'total']
      ],
      where,
      group: [literal('date_trunc(\'day\', "ts_utc")')],
      order: [[literal('dia'), 'ASC']]
    });

    // Llegadas tarde (si usás turno/hora esperada, aquí harías la lógica)
    const llegadasTarde = { total: 0, por_empleado: [] };

    // Ausentismo (se calcula en relación a un padrón y un calendario; aquí placeholder)
    const ausentismo = { total: 0, tasa: 0 };

    // Tasa de reconocimiento (aciertos vs fallos = si score>=thr / si no hubo match; placeholder según tus flags)
    const totalAsist = await Asistencia.count({ where });
    const aciertos = await Asistencia.count({ where: { ...where, score: { [Op.gte]: 0.62 } } });
    const tasaRecon = { aciertos, fallos: totalAsist - aciertos, ratio: totalAsist ? aciertos / totalAsist : 0 };

    // Liveness fallos
    const livenessFallos = await Asistencia.count({ where: { ...where, liveness_passed: false } });

    // Heatmap por hora
    const heat = await Asistencia.findAll({
      attributes: [
        [fn('extract', literal('HOUR from "ts_utc"')), 'hora'],
        [fn('count', col('id')), 'total']
      ],
      where,
      group: [literal('extract(HOUR from "ts_utc")')],
      order: [[literal('hora'), 'ASC']]
    });

    res.json({
      serie_diaria: serie.map(r => ({ fecha: r.get('dia'), total: Number(r.get('total')) })),
      llegadas_tarde: llegadasTarde,
      ausentismo,
      top_tardanzas: [],
      tasa_reconocimiento: tasaRecon,
      liveness_fallos: { total: livenessFallos },
      heatmap_horas: heat.map(r => ({ hora: Number(r.get('hora')), total: Number(r.get('total')) }))
    });
  } catch (err) { next(err); }
}
