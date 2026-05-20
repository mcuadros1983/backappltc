import * as chrono from "chrono-node";

export function normalizeText(text = "") {
  return String(text)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[¿?¡!.,;:()"]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function toISODate(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

function getNextWeekday(targetDay) {
  const today = new Date();
  const currentDay = today.getDay();
  const diff = (targetDay - currentDay + 7) % 7 || 7;

  const result = new Date(today);
  result.setDate(today.getDate() + diff);
  return result;
}

export function extractBotEntities(text = "") {
  const normalizedText = normalizeText(text);

  const chronoResults = chrono.es.parse(text, new Date(), {
    forwardDate: true,
  });

  const parsedDate = chronoResults?.[0]?.start?.date
    ? chronoResults[0].start.date()
    : null;

  let date = toISODate(parsedDate);

  if (!date && normalizedText.includes("fin de semana")) {
    date = toISODate(getNextWeekday(6));
  }

  const asksSchedule =
    normalizedText.includes("horario") ||
    normalizedText.includes("horarios") ||
    normalizedText.includes("a que hora") ||
    normalizedText.includes("hora abren") ||
    normalizedText.includes("hora cierran");

  const asksOpeningStatus =
    normalizedText.includes("abren") ||
    normalizedText.includes("abierto") ||
    normalizedText.includes("abiertos") ||
    normalizedText.includes("atienden") ||
    normalizedText.includes("trabajan") ||
    normalizedText.includes("cerrado") ||
    normalizedText.includes("cerrados");

  const mentionsSpecialDate =
    Boolean(date) ||
    normalizedText.includes("feriado") ||
    normalizedText.includes("finde") ||
    normalizedText.includes("fin de semana");

  const asksBranches =
    normalizedText.includes("sucursal") ||
    normalizedText.includes("sucursales") ||
    normalizedText.includes("direccion") ||
    normalizedText.includes("ubicacion") ||
    normalizedText.includes("telefono") ||
    normalizedText.includes("local") ||
    normalizedText.includes("locales");

  const zone =
    ["norte", "sur", "este", "oeste", "centro"].find((z) =>
      normalizedText.includes(z)
    ) || null;

  const asksPromotion =
    normalizedText.includes("promo") ||
    normalizedText.includes("promocion") ||
    normalizedText.includes("promociones") ||
    normalizedText.includes("oferta") ||
    normalizedText.includes("ofertas");

  return {
    normalizedText,
    date,
    asksSchedule,
    asksOpeningStatus,
    mentionsSpecialDate,
    asksBranches,
    zone,
    asksPromotion,
    rawDateText: chronoResults?.[0]?.text || null,
  };
}

export default {
  normalizeText,
  extractBotEntities,
};