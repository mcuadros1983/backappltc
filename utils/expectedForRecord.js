// utils/expectedForRecord.js
import DatosEmpleado from '../models/tablas/datosEmpleadoModel.js';
import Jornada from '../models/asistencia/jornadaModel.js';
import JornadaTurno from '../models/asistencia/jornadaTurnoModel.js';
import { Turno } from '../models/asistencia/Turno.js';

// Dado un empleado y un timestamp de marca,
// devolvemos:
// {
//   jornadaNombre: 'COMUN',
//   turnoNombre: 'AM',
//   horaEntrada: '08:30',
//   horaSalida: '13:30'
// }
// o null si no se pudo resolver.
export async function getExpectedForRecordLocal(empleadoId, tsUtcDate) {
  // 1. Busco los datos del empleado (para saber qué jornada tiene asignada)
  const de = await DatosEmpleado.findOne({
    where: { empleado_id: empleadoId },
    include: [{
      model: Jornada,
      as: 'jornada',
      include: [{
        model: Turno,
        as: 'turnos',
        through: { attributes: ['dia_semana', 'vigente_desde', 'vigente_hasta', 'activo', 'orden'] }
      }]
    }]
  });

  if (!de || !de.jornada) return null;

  // Por ahora vamos simple:
  // Tomamos el primer turno activo de esa jornada
  // (Más adelante podés filtrar por día_semana, vigencia, etc.)
  const jornada = de.jornada;
  const turnos = jornada.turnos || [];
  if (!turnos.length) return {
    jornadaNombre: jornada.nombre,
    turnoNombre: null,
    horaEntrada: null,
    horaSalida: null
  };

  // Heurística rápida:
  // - elegimos el turno con menor 'orden' en la tabla pivote,
  //   o simplemente el primero de la lista
  const t0 = turnos[0];
  // ojito: en Sequelize cuando hacés include many-to-many con through,
  //        los atributos extra viven en t0.JornadaTurno (o alias similar)
  // pero para horaEntrada/horaSalida usamos campos reales del Turno
  return {
    jornadaNombre: jornada.nombre,
    turnoNombre: t0.nombre,
    horaEntrada: t0.hora_entrada,
    horaSalida: t0.hora_salida,
  };
}
