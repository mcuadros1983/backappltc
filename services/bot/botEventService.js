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

function matchArrayField(items = [], q = "") {
  if (!Array.isArray(items)) return false;

  const cleanQ = normalizeText(q);

  return items.some((item) => normalizeText(item).includes(cleanQ));
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

    where[Op.and] = [
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
      ["fecha_inicio", "ASC"],
      ["prioridad", "DESC"],
      ["id", "ASC"],
    ],
  });

  if (!filters.q) return rows;

  const q = normalizeText(filters.q);

  return rows.filter((row) => {
    const data = row.toJSON();

    const fields = [
      data.tipo_evento,
      data.titulo,
      data.descripcion,
      data.condiciones,
      data.mensaje_bot,
      data.sucursal?.nombre,
      data.sucursal?.codigo,
    ]
      .filter(Boolean)
      .map(normalizeText);

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

  await row.update({
    tipo_evento: data.tipo_evento ?? row.tipo_evento,
    titulo: data.titulo ?? row.titulo,
    descripcion: data.descripcion ?? row.descripcion,
    fecha_inicio: data.fecha_inicio ?? row.fecha_inicio,
    fecha_fin: data.fecha_fin ?? row.fecha_fin,
    hora_inicio: data.hora_inicio ?? row.hora_inicio,
    hora_fin: data.hora_fin ?? row.hora_fin,
    sucursal_id:
      data.aplica_todas_sucursales === true
        ? null
        : data.sucursal_id ?? row.sucursal_id,
    aplica_todas_sucursales:
      typeof data.aplica_todas_sucursales === "boolean"
        ? data.aplica_todas_sucursales
        : row.aplica_todas_sucursales,
    condiciones: data.condiciones ?? row.condiciones,
    mensaje_bot: data.mensaje_bot ?? row.mensaje_bot,
    aliases: Array.isArray(data.aliases) ? data.aliases : row.aliases,
    activo_bot:
      typeof data.activo_bot === "boolean" ? data.activo_bot : row.activo_bot,
    prioridad:
      data.prioridad !== undefined
        ? Number(data.prioridad || 0)
        : row.prioridad,
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
  const fecha = options.fecha || todayISO();
  const limit = Number(options.limit || 30);
  const sucursal_id = options.sucursal_id || null;

  const where = {
    activo_bot: true,
    fecha_inicio: {
      [Op.lte]: fecha,
    },
    [Op.or]: [
      { fecha_fin: null },
      {
        fecha_fin: {
          [Op.gte]: fecha,
        },
      },
    ],
  };

  if (sucursal_id) {
    where[Op.and] = [
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

  const scored = rows
    .map((row) => {
      const data = row.toJSON();

      const fields = [
        data.tipo_evento,
        data.titulo,
        data.descripcion,
        data.condiciones,
        data.mensaje_bot,
        data.sucursal?.nombre,
        data.sucursal?.codigo,
        ...(Array.isArray(data.aliases) ? data.aliases : []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

      let score = Number(data.prioridad || 0);

      if (fields.includes(q)) score += 10;

      const words = q.split(" ").filter((word) => word.length >= 3);

      for (const word of words) {
        if (fields.includes(word)) score += 2;
      }

      return { row, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.row);

  return scored;
}

export function buildEventReply(events = []) {
  if (!Array.isArray(events) || events.length === 0) {
    return null;
  }

  const lines = events.map((event) => {
    const data = event.toJSON ? event.toJSON() : event;

    const fecha =
      data.fecha_inicio === data.fecha_fin || !data.fecha_fin
        ? data.fecha_inicio
        : `${data.fecha_inicio} al ${data.fecha_fin}`;

    const horario =
      data.hora_inicio || data.hora_fin
        ? `Horario: ${data.hora_inicio || ""}${
            data.hora_fin ? ` a ${data.hora_fin}` : ""
          }`
        : null;

    const sucursal = data.aplica_todas_sucursales
      ? "Todas las sucursales"
      : data.sucursal?.nombre || data.sucursal?.descripcion || "Sucursal específica";

    const parts = [];

    parts.push(`• ${data.titulo}`);
    parts.push(`Fecha: ${fecha}`);
    parts.push(`Sucursal: ${sucursal}`);

    if (horario) parts.push(horario);
    if (data.condiciones) parts.push(`Condiciones: ${data.condiciones}`);
    if (data.mensaje_bot) parts.push(data.mensaje_bot);

    return parts.join("\n  ");
  });

  return `Te cuento los eventos o novedades vigentes:\n\n${lines.join(
    "\n\n"
  )}\n\n¿Querés que te pase información de alguna sucursal en particular?`;
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