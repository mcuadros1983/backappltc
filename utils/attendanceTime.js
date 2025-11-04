// utils/attendanceTime.js

// Usamos una zona fija UTC-3 (Argentina), para que Railway (UTC)
// no rompa el cálculo.
const TZ_OFFSET_MINUTES = 180; // 3 horas * 60 = 180

// Convierte un Date UTC a "hora local AR" (devuelve otro Date)
export function toLocalAR(dateUtc) {
  const ms = dateUtc.getTime() - TZ_OFFSET_MINUTES * 60 * 1000;
  return new Date(ms);
}

// Construye un Date local AR con la misma fecha que markLocal
// y hora hh:mm esperada (string "08:30", etc.)
export function buildExpectedLocal(markLocalDate, hhmm) {
  if (!hhmm) return null;
  const [hh, mm] = hhmm.split(':').map(n => parseInt(n, 10));
  const d = new Date(markLocalDate.getTime());
  d.setHours(hh, mm, 0, 0);
  return d;
}

// Diferencia absoluta entre 2 Date, formateada hh:mm:ss
export function diffHhmmssAbs(a, b) {
  if (!a || !b) return null;
  let diffMs = Math.abs(a.getTime() - b.getTime());
  const totalSec = Math.floor(diffMs / 1000);
  const hh = String(Math.floor(totalSec / 3600)).padStart(2, '0');
  const mm = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0');
  const ss = String(totalSec % 60).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}
