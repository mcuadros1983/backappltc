// utils/decorateRow.js
import { toLocalAR, buildExpectedLocal, diffHhmmssAbs } from './attendanceTime.js';
import { getExpectedForRecordLocal } from './expectedForRecord.js';

export async function decorateAsistenciaRow(aInstancePlain) {
  // aInstancePlain es el .get({ plain:true }) de la fila de Asistencia
  // y ya viene con .Empleadotabla y .Sucursal por el include.

  const out = {
    id: aInstancePlain.id,
    empleado_id: aInstancePlain.empleado_id,
    sucursal_id: aInstancePlain.sucursal_id,
    ts_utc: aInstancePlain.ts_utc,
    device_id: aInstancePlain.device_id,
    metodo: aInstancePlain.metodo,
    score: aInstancePlain.score,
    liveness_passed: aInstancePlain.liveness_passed,
    lat: aInstancePlain.lat,
    lon: aInstancePlain.lon,
    operation_concept: aInstancePlain.operation_concept ?? null,
    // nombres básicos
    empleado_apellido: aInstancePlain.Empleadotabla?.apellido || null,
    empleado_nombre: aInstancePlain.Empleadotabla?.nombre || null,
    sucursal_nombre: aInstancePlain.Sucursal?.nombre
      ? `[${aInstancePlain.Sucursal.id}] ${aInstancePlain.Sucursal.nombre}`
      : null,
  };

  // 1. Resolver jornada/turno esperado
  const expected = await getExpectedForRecordLocal(
    aInstancePlain.empleado_id,
    aInstancePlain.ts_utc ? new Date(aInstancePlain.ts_utc) : null
  );

  // attach jornada/turno info
  out.jornada_nombre = expected?.jornadaNombre || null;
  out.turno_nombre = expected?.turnoNombre || null;
  const horaEntrada = expected?.horaEntrada || null;
  const horaSalida  = expected?.horaSalida  || null;

  // 2. Calcular expected_time y delta usando zona fija AR
  //    - Marcación real (UTC -> local AR)
  if (aInstancePlain.ts_utc) {
    const markUtc = new Date(aInstancePlain.ts_utc);
    if (!isNaN(markUtc)) {
      const markLocal = toLocalAR(markUtc);

      // elegir hora esperada según concepto
      let refHHMM = null;
      if (out.operation_concept === 'INGRESO') {
        refHHMM = horaEntrada;
      } else if (out.operation_concept === 'EGRESO') {
        refHHMM = horaSalida;
      }

      if (refHHMM) {
        const expLocal = buildExpectedLocal(markLocal, refHHMM);
        out.expected_time = refHHMM; // ej "08:30"
        out.delta_hhmmss = expLocal ? diffHhmmssAbs(markLocal, expLocal) : null;
      } else {
        out.expected_time = null;
        out.delta_hhmmss = null;
      }
    } else {
      out.expected_time = null;
      out.delta_hhmmss = null;
    }
  } else {
    out.expected_time = null;
    out.delta_hhmmss = null;
  }

  return out;
}
