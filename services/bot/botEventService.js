import { Op } from "sequelize";
import BotEventMeta from "../../models/bot/botEventMetaModel.js";
import Sucursal from "../../models/gmedias/sucursalModel.js";

function normalizeText(text = "") {
  return String(text)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[¿?¡!.,;:()"]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function toBoolean(value, defaultValue = true) {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return defaultValue;
}

function emptyToNull(value) {
  return value === "" || value === undefined ? null : value;
}

function normalizeAliases(value) {
  if (Array.isArray(value)) return value;

  if (typeof value === "string") {
    return value
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
  }

  return [];
}

function matchArrayField(items = [], q = "") {
  if (!Array.isArray(items)) return false;
  const cleanQ = normalizeText(q);

  return items.some((item) => normalizeText(item).includes(cleanQ));
}

function getMonthNumber(monthText = "") {
  const month = normalizeText(monthText);

  const months = {
    enero: "01",
    febrero: "02",
    marzo: "03",
    abril: "04",
    mayo: "05",
    junio: "06",
    julio: "07",
    agosto: "08",
    septiembre: "09",
    setiembre: "09",
    octubre: "10",
    noviembre: "11",
    diciembre: "12",
  };

  return months[month] || null;
}

function extractEventDate(text = "") {
  const clean = normalizeText(text);

  const currentYear = new Date().getFullYear();

  const directDates = [
    { patterns: ["1 de mayo", "1 mayo", "01 de mayo", "01 mayo"], date: `${currentYear}-05-01` },
    { patterns: ["25 de mayo", "25 mayo"], date: `${currentYear}-05-25` },
    { patterns: ["9 de julio", "9 julio", "09 de julio", "09 julio"], date: `${currentYear}-07-09` },
    { patterns: ["24 de diciembre", "24 diciembre"], date: `${currentYear}-12-24` },
    { patterns: ["25 de diciembre", "25 diciembre", "navidad"], date: `${currentYear}-12-25` },
    { patterns: ["31 de diciembre", "31 diciembre"], date: `${currentYear}-12-31` },
    { patterns: ["1 de enero", "1 enero", "01 de enero", "01 enero", "año nuevo", "ano nuevo"], date: `${currentYear}-01-01` },
  ];

  for (const item of directDates) {
    if (item.patterns.some((pattern) => clean.includes(pattern))) {
      return item.date;
    }
  }

  const match = clean.match(/\b(\d{1,2})\s*(?:de)?\s*(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)\b/);

  if (match) {
    const day = String(match[1]).padStart(2, "0");
    const month = getMonthNumber(match[2]);

    if (month) {
      return `${currentYear}-${month}-${day}`;
    }
  }

  if (clean.includes("hoy")) {
    return todayISO();
  }

  if (clean.includes("mañana") || clean.includes("manana")) {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    return date.toISOString().slice(0, 10);
  }

  return null;
}

function getEventTextFields(data = {}) {
  return [
    data.tipo_evento,
    data.titulo,
    data.descripcion,
    data.condiciones,
    data.mensaje_bot,
    data.impacto,
    data.sucursal?.nombre,
    data.sucursal?.codigo,
  ]
    .filter(Boolean)
    .map(normalizeText);
}

function scoreEvent(row, query = "", detectedDate = null) {
  const data = row.toJSON ? row.toJSON() : row;
  const q = normalizeText(query);

  const fields = getEventTextFields(data);
  const aliases = Array.isArray(data.aliases)
    ? data.aliases.map((alias) => normalizeText(alias))
    : [];

  const STOP_WORDS = new Set([
    "abren",
    "abren",
    "atienden",
    "trabajan",
    "hay",
    "el",
    "la",
    "los",
    "las",
    "de",
    "del",
    "en",
    "para",
    "por",
    "feriado",
    "evento",
    "horario",
    "sucursal",
    "sucursales",
    "dime",
    "dame",
    "decime",
    "cuentame",
    "contame",
  ]);

  const words = q
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length >= 3 && !STOP_WORDS.has(word));

  let score = 0;

  if (detectedDate) {
    score += 80;
  }

  if (aliases.includes(q)) score += 120;

  for (const alias of aliases) {
    if (!alias) continue;

    if (q.includes(alias)) score += 90;
    if (alias.includes(q)) score += 70;

    for (const word of words) {
      if (alias === word) score += 50;
      else if (alias.includes(word)) score += 25;
    }
  }

  for (const field of fields) {
    if (field === q) score += 100;
    if (field.includes(q)) score += 60;

    for (const word of words) {
      if (field.includes(word)) score += 15;
    }
  }

  score += Number(data.prioridad || 0) / 100;

  return score;
}

function buildDateWhere(desde, hasta) {
  return {
    [Op.and]: [
      {
        fecha_inicio: {
          [Op.lte]: hasta,
        },
      },
      {
        [Op.or]: [
          { fecha_fin: null },
          {
            fecha_fin: {
              [Op.gte]: desde,
            },
          },
        ],
      },
    ],
  };
}

export async function listBotEventMeta(filters = {}) {
  const where = {};

  if (filters.activo_bot !== undefined) {
    where.activo_bot =
      filters.activo_bot === true || filters.activo_bot === "true";
  }

  if (filters.tipo_evento) {
    where.tipo_evento = filters.tipo_evento;
  }

  if (filters.sucursal_id) {
    where[Op.or] = [
      { aplica_todas_sucursales: true },
      { sucursal_id: filters.sucursal_id },
    ];
  }

  if (filters.desde || filters.hasta) {
    const desde = filters.desde || todayISO();
    const hasta = filters.hasta || desde;

    Object.assign(where, buildDateWhere(desde, hasta));
  }

  const rows = await BotEventMeta.findAll({
    where,
    include: [
      {
        model: Sucursal,
        as: "sucursal",
        required: false,
      },
    ],
    order: [
      ["fecha_inicio", "ASC"],
      ["prioridad", "DESC"],
      ["id", "ASC"],
    ],
  });

  if (!filters.q) return rows;

  const q = normalizeText(filters.q);

  return rows.filter((row) => {
    const data = row.toJSON();
    const fields = getEventTextFields(data);

    return (
      fields.some((field) => field.includes(q)) ||
      matchArrayField(data.aliases, q)
    );
  });
}

export async function getBotEventMetaById(id) {
  return BotEventMeta.findByPk(id, {
    include: [
      {
        model: Sucursal,
        as: "sucursal",
        required: false,
      },
    ],
  });
}

export async function createBotEventMeta(data = {}) {
  const aplicaTodas = toBoolean(data.aplica_todas_sucursales, true);

  if (!data.tipo_evento) {
    throw new Error("Debe indicar el tipo de evento");
  }

  if (!data.titulo) {
    throw new Error("Debe indicar el título del evento");
  }

  if (!data.fecha_inicio) {
    throw new Error("Debe indicar la fecha de inicio");
  }

  if (!aplicaTodas && !data.sucursal_id) {
    throw new Error("Debe seleccionar una sucursal o marcar que aplica a todas");
  }

  return BotEventMeta.create({
    tipo_evento: data.tipo_evento,
    titulo: data.titulo,
    descripcion: emptyToNull(data.descripcion),

    fecha_inicio: data.fecha_inicio,
    fecha_fin: data.fecha_fin || data.fecha_inicio,

    hora_inicio: emptyToNull(data.hora_inicio),
    hora_fin: emptyToNull(data.hora_fin),

    sucursal_id: aplicaTodas ? null : Number(data.sucursal_id),
    aplica_todas_sucursales: aplicaTodas,

    condiciones: emptyToNull(data.condiciones),
    mensaje_bot: emptyToNull(data.mensaje_bot),

    aliases: normalizeAliases(data.aliases),

    activo_bot: toBoolean(data.activo_bot, true),
    prioridad: Number(data.prioridad || 0),
    impacto: emptyToNull(data.impacto),
  });
}

export async function updateBotEventMeta(id, data = {}) {
  const row = await BotEventMeta.findByPk(id);

  if (!row) return null;

  const aplicaTodas =
    data.aplica_todas_sucursales !== undefined
      ? toBoolean(data.aplica_todas_sucursales, row.aplica_todas_sucursales)
      : row.aplica_todas_sucursales;

  await row.update({
    tipo_evento: data.tipo_evento ?? row.tipo_evento,
    titulo: data.titulo ?? row.titulo,
    descripcion:
      data.descripcion !== undefined ? emptyToNull(data.descripcion) : row.descripcion,

    fecha_inicio: data.fecha_inicio ?? row.fecha_inicio,
    fecha_fin:
      data.fecha_fin !== undefined
        ? data.fecha_fin || data.fecha_inicio || row.fecha_inicio
        : row.fecha_fin,

    hora_inicio:
      data.hora_inicio !== undefined ? emptyToNull(data.hora_inicio) : row.hora_inicio,
    hora_fin:
      data.hora_fin !== undefined ? emptyToNull(data.hora_fin) : row.hora_fin,

    sucursal_id: aplicaTodas
      ? null
      : data.sucursal_id !== undefined && data.sucursal_id !== ""
      ? Number(data.sucursal_id)
      : row.sucursal_id,

    aplica_todas_sucursales: aplicaTodas,

    condiciones:
      data.condiciones !== undefined ? emptyToNull(data.condiciones) : row.condiciones,
    mensaje_bot:
      data.mensaje_bot !== undefined ? emptyToNull(data.mensaje_bot) : row.mensaje_bot,

    aliases:
      data.aliases !== undefined ? normalizeAliases(data.aliases) : row.aliases,

    activo_bot:
      data.activo_bot !== undefined
        ? toBoolean(data.activo_bot, row.activo_bot)
        : row.activo_bot,

    prioridad:
      data.prioridad !== undefined
        ? Number(data.prioridad || 0)
        : row.prioridad,

    impacto:
      data.impacto !== undefined ? emptyToNull(data.impacto) : row.impacto,
  });

  return getBotEventMetaById(id);
}

export async function deleteBotEventMeta(id) {
  const row = await BotEventMeta.findByPk(id);

  if (!row) return false;

  await row.destroy();

  return true;
}

export async function searchEventMetaCandidates(text = "", options = {}) {
  const q = normalizeText(text);
  const detectedDate = extractEventDate(text);
  const fecha = options.fecha || detectedDate || todayISO();
  const limit = Number(options.limit || 30);
  const sucursal_id = options.sucursal_id || null;

  const where = {
    activo_bot: true,
    ...buildDateWhere(fecha, fecha),
  };

  if (sucursal_id) {
    where[Op.and] = [
      ...(where[Op.and] || []),
      {
        [Op.or]: [
          { aplica_todas_sucursales: true },
          { sucursal_id },
        ],
      },
    ];
  }

  const rows = await BotEventMeta.findAll({
    where,
    include: [
      {
        model: Sucursal,
        as: "sucursal",
        required: false,
      },
    ],
    order: [
      ["prioridad", "DESC"],
      ["fecha_inicio", "ASC"],
      ["id", "ASC"],
    ],
  });

  if (!rows.length) return [];

  const scored = rows
    .map((row) => ({
      row,
      score: scoreEvent(row, q, detectedDate),
    }))
    .filter((item) => {
      if (detectedDate) return item.score > 0;
      return item.score >= 10;
    })
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((item) => item.row);
}

export function buildEventReply(events = []) {
  if (!Array.isArray(events) || events.length === 0) {
    return "No tengo eventos o cambios especiales cargados en este momento. Si necesitás consultar una sucursal puntual, decime cuál y te paso sus datos de contacto.";
  }

  const lines = events.map((event) => {
    const data = event.toJSON ? event.toJSON() : event;

    const title = data.titulo || "Evento";
    const dateText =
      data.fecha_inicio && data.fecha_fin && data.fecha_inicio !== data.fecha_fin
        ? `${data.fecha_inicio} al ${data.fecha_fin}`
        : data.fecha_inicio || "";

    const sucursalText = data.aplica_todas_sucursales
      ? "Aplica a todas las sucursales."
      : data.sucursal?.nombre
      ? `Sucursal: ${data.sucursal.nombre}.`
      : "";

    let impactoText = "";

    if (data.impacto === "cerrado") {
      impactoText = "Ese día permaneceremos cerrados.";
    } else if (data.impacto === "horario_reducido") {
      impactoText = "Ese día atenderemos con horario reducido.";
    } else if (data.impacto === "normal") {
      impactoText = "La atención será normal.";
    }

    const horarioText =
      data.hora_inicio || data.hora_fin
        ? `Horario: ${data.hora_inicio || ""}${data.hora_fin ? ` a ${data.hora_fin}` : ""}.`
        : "";

    return [
      `• ${title}`,
      dateText ? `Fecha: ${dateText}.` : "",
      impactoText,
      horarioText,
      data.mensaje_bot || data.descripcion || "",
      data.condiciones ? `Condiciones: ${data.condiciones}` : "",
      sucursalText,
    ]
      .filter(Boolean)
      .join("\n  ");
  });

  return lines.join("\n\n");
}

export default {
  listBotEventMeta,
  getBotEventMetaById,
  createBotEventMeta,
  updateBotEventMeta,
  deleteBotEventMeta,
  searchEventMetaCandidates,
  buildEventReply,
};