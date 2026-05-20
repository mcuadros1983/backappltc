import { Op } from "sequelize";
import BotBranchMeta from "../../models/bot/botBranchMetaModel.js";
import Sucursal from "../../models/gmedias/sucursalModel.js";

function normalizeText(text = "") {
  return String(text)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function matchArrayField(items = [], q = "") {
  if (!Array.isArray(items)) return false;

  const cleanQ = normalizeText(q);

  return items.some((item) => normalizeText(item).includes(cleanQ));
}

export async function listBotBranchMeta(filters = {}) {
  const where = {};

  if (filters.activo_bot !== undefined) {
    where.activo_bot =
      filters.activo_bot === true || filters.activo_bot === "true";
  }

  const rows = await BotBranchMeta.findAll({
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
      ["id", "ASC"],
    ],
  });

  if (!filters.q) return rows;

  const q = normalizeText(filters.q);

  return rows.filter((row) => {
    const data = row.toJSON();

    const fields = [
      data.nombre_visible,
      data.direccion,
      data.google_maps_url,
      data.zona,
      data.horario_atencion,
      data.telefono,
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

export async function getBotBranchMetaById(id) {
  return BotBranchMeta.findByPk(id, {
    include: [
      {
        model: Sucursal,
        as: "sucursal",
        required: false,
      },
    ],
  });
}

export async function createBotBranchMeta(data = {}) {
  return BotBranchMeta.create({
    sucursal_id: data.sucursal_id,
    nombre_visible: data.nombre_visible,
    direccion: data.direccion || null,
    google_maps_url: data.google_maps_url || null,
    lat: data.lat || null,
    lon: data.lon || null,
    zona: data.zona || null,
    aliases: Array.isArray(data.aliases) ? data.aliases : [],
    horario_atencion: data.horario_atencion || null,
    telefono: data.telefono || null,
    mensaje_bot: data.mensaje_bot || null,
    activo_bot:
      typeof data.activo_bot === "boolean" ? data.activo_bot : true,
    prioridad: Number(data.prioridad || 0),
  });
}

export async function updateBotBranchMeta(id, data = {}) {
  const row = await BotBranchMeta.findByPk(id);

  if (!row) return null;

  await row.update({
    sucursal_id: data.sucursal_id ?? row.sucursal_id,
    nombre_visible: data.nombre_visible ?? row.nombre_visible,
    direccion: data.direccion ?? row.direccion,
    google_maps_url: data.google_maps_url ?? row.google_maps_url,
    lat: data.lat ?? row.lat,
    lon: data.lon ?? row.lon,
    zona: data.zona ?? row.zona,
    aliases: Array.isArray(data.aliases) ? data.aliases : row.aliases,
    horario_atencion: data.horario_atencion ?? row.horario_atencion,
    telefono: data.telefono ?? row.telefono,
    mensaje_bot: data.mensaje_bot ?? row.mensaje_bot,
    activo_bot:
      typeof data.activo_bot === "boolean"
        ? data.activo_bot
        : row.activo_bot,
    prioridad:
      data.prioridad !== undefined
        ? Number(data.prioridad || 0)
        : row.prioridad,
  });

  return getBotBranchMetaById(id);
}

export async function deleteBotBranchMeta(id) {
  const row = await BotBranchMeta.findByPk(id);

  if (!row) return false;

  await row.destroy();

  return true;
}

export async function searchBranchMetaCandidates(text = "", limit = 3) {
  const q = normalizeText(text);
  const safeLimit = Math.min(Number(limit || 3), 50);

  const STOP_WORDS = new Set([
    "que",
    "cual",
    "cuales",
    "sucursal",
    "sucursales",
    "hay",
    "tenes",
    "tienen",
    "dame",
    "pasame",
    "mostrar",
    "mostrame",
    "direccion",
    "direcciones",
    "telefono",
    "telefonos",
    "ubicacion",
    "ubicaciones",
    "local",
    "locales",
    "zona",
    "zonas",
    "en",
    "el",
    "la",
    "los",
    "las",
    "del",
    "de",
    "por",
    "para",
  ]);

  const queryWords = q
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length >= 3 && !STOP_WORDS.has(word));

  const rows = await BotBranchMeta.findAll({
    where: {
      activo_bot: true,
    },
    include: [
      {
        model: Sucursal,
        as: "sucursal",
        required: false,
      },
    ],
    order: [
      ["prioridad", "DESC"],
      ["id", "ASC"],
    ],
  });

  const scored = rows
    .map((row) => {
      const data = row.toJSON();

      const nombre = normalizeText(data.nombre_visible || "");
      const direccion = normalizeText(data.direccion || "");
      const zona = normalizeText(data.zona || "");
      const horario = normalizeText(data.horario_atencion || "");
      const telefono = normalizeText(data.telefono || "");
      const mensaje = normalizeText(data.mensaje_bot || "");
      const sucursalNombre = normalizeText(data.sucursal?.nombre || "");
      const sucursalCodigo = normalizeText(data.sucursal?.codigo || "");

      const aliases = Array.isArray(data.aliases)
        ? data.aliases.map((alias) => normalizeText(alias))
        : [];

      let score = 0;

      // Coincidencias fuertes: zona y aliases.
      if (zona && zona === q) score += 120;
      if (zona && q.includes(zona)) score += 90;
      if (zona && queryWords.includes(zona)) score += 90;

      if (aliases.includes(q)) score += 120;

      for (const alias of aliases) {
        if (!alias) continue;

        if (q.includes(alias)) score += 90;
        if (alias.includes(q)) score += 70;

        for (const word of queryWords) {
          if (alias === word) score += 80;
          else if (alias.includes(word)) score += 45;
        }
      }

      // Coincidencias por nombre/dirección.
      if (nombre && nombre === q) score += 100;
      if (nombre && nombre.includes(q)) score += 60;
      if (sucursalNombre && sucursalNombre.includes(q)) score += 60;
      if (direccion && direccion.includes(q)) score += 45;

      for (const word of queryWords) {
        if (nombre.includes(word)) score += 20;
        if (sucursalNombre.includes(word)) score += 20;
        if (direccion.includes(word)) score += 15;
        if (horario.includes(word)) score += 5;
        if (telefono.includes(word)) score += 5;
        if (mensaje.includes(word)) score += 5;
        if (sucursalCodigo && sucursalCodigo === word) score += 50;
      }

      return {
        row,
        score,
        prioridad: Number(data.prioridad || 0),
      };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.prioridad - a.prioridad;
    });

  return scored.slice(0, safeLimit).map((item) => item.row);
}
export async function getAllActiveBranchMeta() {
  return BotBranchMeta.findAll({
    where: {
      activo_bot: true,
    },
    include: [
      {
        model: Sucursal,
        as: "sucursal",
        required: false,
      },
    ],
    order: [
      ["prioridad", "DESC"],
      ["id", "ASC"],
    ],
  });
}
export function buildBranchLocationReply(branchMeta) {
  if (!branchMeta) return null;

  const data = branchMeta.toJSON ? branchMeta.toJSON() : branchMeta;

  const mapsUrl =
    data.google_maps_url ||
    (data.lat && data.lon
      ? `https://www.google.com/maps?q=${data.lat},${data.lon}`
      : null);

  const lines = [];

  lines.push(`📍 ${data.nombre_visible}`);

  if (data.direccion) {
    lines.push(`Dirección: ${data.direccion}`);
  }

  if (data.horario_atencion) {
    lines.push(`Horario: ${data.horario_atencion}`);
  }

  if (data.telefono) {
    lines.push(`Teléfono: ${data.telefono}`);
  }

  if (mapsUrl) {
    lines.push(`Ubicación: ${mapsUrl}`);
  }

  if (data.mensaje_bot) {
    lines.push(data.mensaje_bot);
  }

  return lines.join("\n");
}

export default {
  listBotBranchMeta,
  getBotBranchMetaById,
  createBotBranchMeta,
  updateBotBranchMeta,
  deleteBotBranchMeta,
  searchBranchMetaCandidates,
  buildBranchLocationReply,
};