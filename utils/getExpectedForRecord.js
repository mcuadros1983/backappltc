import DatosEmpleado from '../models/tablas/datosEmpleadoModel.js';
import Jornada from '../models/asistencia/jornadaModel.js';
import JornadaTurno from '../models/asistencia/jornadaTurnoModel.js';
import { Turno } from '../models/asistencia/Turno.js';

const AR_TZ = 'America/Argentina/Buenos_Aires';

// convierte una marca UTC -> hora local Argentina en minutos desde 00:00
function getArgentinaMinuteOfDay(dateUtc) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: AR_TZ,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(dateUtc);

  const hh = parseInt(parts.find(p => p.type === 'hour')?.value ?? '0', 10);
  const mm = parseInt(parts.find(p => p.type === 'minute')?.value ?? '0', 10);

  return {
    hh,
    mm,
    totalMin: hh * 60 + mm,
  };
}

function hhmmToMinutes(hhmm) {
  if (!hhmm || typeof hhmm !== 'string') return null;
  const [hStr, mStr] = hhmm.split(':');
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

/**
 * Dado empleado_id, timestamp UTC de la marca y concepto (INGRESO/EGRESO),
 * devolveme cuál turno de su jornada es el más cercano en el tiempo.
 *
 * Retorno:
 * {
 *   jornadaNombre,
 *   turnoNombre,
 *   horaEntrada,
 *   horaSalida,
 * }
 */
export async function getExpectedForRecord(empleadoId, tsUTC, concept) {
  console.log("\n===============================");
  console.log("📘 getExpectedForRecord()");
  console.log("   empleadoId:", empleadoId);
  console.log("   tsUTC:", tsUTC);
  console.log("   concept:", concept);

  // 1) Buscar datosEmpleado para saber la jornada asignada
  const datos = await DatosEmpleado.findOne({
    where: { empleado_id: empleadoId }
  });

  if (!datos) {
    console.log("❌ No hay DatosEmpleado para este empleado");
    console.log("===============================\n");
    return null;
  }
  if (!datos.jornada_id) {
    console.log("❌ El empleado no tiene jornada_id asignada en datosempleado");
    console.log("===============================\n");
    return null;
  }

  console.log("✅ jornada_id asignada:", datos.jornada_id);

  // 2) Traer la jornada + sus turnos + la pivote JornadaTurno
  const jornada = await Jornada.findByPk(datos.jornada_id, {
    include: [{
      model: Turno,
      as: 'turnos',
      through: {
        model: JornadaTurno,
        attributes: [
          'vigente_desde',
          'vigente_hasta',
          'activo',
          'orden',
        ],
      },
    }],
  });

  if (!jornada) {
    console.log("❌ No se encontró la jornada en BD");
    console.log("===============================\n");
    return null;
  }

  console.log("🧭 Jornada encontrada:", jornada.nombre);
  console.log("🕑 Turnos declarados en la jornada:");
  (jornada.turnos || []).forEach((t, idx) => {
    console.log(`   [${idx}] ${t.nombre} => ${t.hora_entrada} - ${t.hora_salida}`);
  });

  // 3) Obtener hora local AR en minutos para la marca
  const ts = new Date(tsUTC);
  const { hh, mm, totalMin: marcaMin } = getArgentinaMinuteOfDay(ts);
  console.log(`🕒 Hora local (AR) de la marca: ${hh}:${String(mm).padStart(2,"0")} => ${marcaMin} minutos desde 00:00`);

  // 4) Filtramos turnos activos / vigentes y calculamos distancia
  const tsMs = ts.getTime();
  const candidatos = [];

  for (const turno of jornada.turnos || []) {
    const link = turno.JornadaTurno || turno.jornadaTurno || turno.jornada_turno;
    if (!link) {
      console.log(`⏩ Turno ${turno.nombre} descartado (sin link pivote)`);
      continue;
    }

    if (link.activo === false) {
      console.log(`⏩ Turno ${turno.nombre} descartado (inactivo en pivote)`);
      continue;
    }

    // chequeo vigencia por fechas, si vienen seteadas
    const vd = link.vigente_desde ? new Date(link.vigente_desde).getTime() : null;
    const vh = link.vigente_hasta ? new Date(link.vigente_hasta).getTime() : null;

    if (vd != null && tsMs < vd) {
      console.log(`⏩ Turno ${turno.nombre} descartado (antes de vigente_desde)`);
      continue;
    }
    if (vh != null && tsMs > vh) {
      console.log(`⏩ Turno ${turno.nombre} descartado (después de vigente_hasta)`);
      continue;
    }

    // elegimos referencia según concepto
    // INGRESO => hora_entrada
    // EGRESO  => hora_salida
    const refMin = concept === 'EGRESO'
      ? hhmmToMinutes(turno.hora_salida)
      : hhmmToMinutes(turno.hora_entrada);

    if (refMin == null) {
      console.log(`⏩ Turno ${turno.nombre} descartado (refMin null, horas mal cargadas?)`);
      continue;
    }

    const distancia = Math.abs(marcaMin - refMin);

    candidatos.push({
      turnoNombre: turno.nombre,
      horaEntrada: turno.hora_entrada,
      horaSalida: turno.hora_salida,
      distancia,
      orden: link.orden ?? 0,
    });

    console.log(
      `📊 Candidato ${turno.nombre} -> refMin=${refMin} vs marcaMin=${marcaMin} => distancia=${distancia} min`
    );
  }

  if (!candidatos.length) {
    console.log("❌ Ningún turno candidato válido");
    console.log("===============================\n");
    return null;
  }

  // 5) elegimos:
  //   1) menor distancia
  //   2) si empatan distancia, menor orden
  candidatos.sort((a, b) => {
    if (a.distancia !== b.distancia) return a.distancia - b.distancia;
    return a.orden - b.orden;
  });

  const elegido = candidatos[0];

  console.log("✅ Turno elegido:", elegido.turnoNombre);
  console.log("   distancia:", elegido.distancia, "min");
  console.log("   orden:", elegido.orden);
  console.log("===============================\n");

  return {
    jornadaNombre: jornada.nombre,
    turnoNombre: elegido.turnoNombre,
    horaEntrada: elegido.horaEntrada,
    horaSalida:  elegido.horaSalida,
  };
}
