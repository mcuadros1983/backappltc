import BotBenefitMeta from "../../models/bot/botBenefitMetaModel.js";
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

function matchArrayField(items = [], q = "") {
  if (!Array.isArray(items)) return false;

  const cleanQ = normalizeText(q);

  return items.some((item) => normalizeText(item).includes(cleanQ));
}

export async function listBotBenefitMeta(filters = {}) {
  const where = {};

  if (filters.activo_bot !== undefined) {
    where.activo_bot =
      filters.activo_bot === true || filters.activo_bot === "true";
  }

  if (filters.tipo_beneficio) {
    where.tipo_beneficio = filters.tipo_beneficio;
  }

  const rows = await BotBenefitMeta.findAll({
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
      data.tipo_beneficio,
      data.titulo,
      data.descripcion,
      data.condiciones,
      data.horario_aplica,
      data.medio_pago,
      data.entidad,
      data.mensaje_bot,
      data.sucursal?.nombre,
      data.sucursal?.codigo,
      ...(Array.isArray(data.dias_aplica) ? data.dias_aplica : []),
    ]
      .filter(Boolean)
      .map(normalizeText);

    return (
      fields.some((field) => field.includes(q)) ||
      matchArrayField(data.aliases, q)
    );
  });
}

export async function getBotBenefitMetaById(id) {
  return BotBenefitMeta.findByPk(id, {
    include: [
      {
        model: Sucursal,
        as: "sucursal",
        required: false,
      },
    ],
  });
}

export async function createBotBenefitMeta(data = {}) {
  return BotBenefitMeta.create({
    tipo_beneficio: data.tipo_beneficio,
    titulo: data.titulo,
    descripcion: data.descripcion || null,
    porcentaje_descuento: data.porcentaje_descuento || null,
    condiciones: data.condiciones || null,
    dias_aplica: Array.isArray(data.dias_aplica) ? data.dias_aplica : [],
    horario_aplica: data.horario_aplica || null,
    sucursal_id: data.sucursal_id || null,
    aplica_todas_sucursales:
      typeof data.aplica_todas_sucursales === "boolean"
        ? data.aplica_todas_sucursales
        : true,
    medio_pago: data.medio_pago || null,
    entidad: data.entidad || null,
    mensaje_bot: data.mensaje_bot || null,
    aliases: Array.isArray(data.aliases) ? data.aliases : [],
    activo_bot:
      typeof data.activo_bot === "boolean" ? data.activo_bot : true,
    prioridad: Number(data.prioridad || 0),
  });
}

export async function updateBotBenefitMeta(id, data = {}) {
  const row = await BotBenefitMeta.findByPk(id);

  if (!row) return null;

  await row.update({
    tipo_beneficio: data.tipo_beneficio ?? row.tipo_beneficio,
    titulo: data.titulo ?? row.titulo,
    descripcion: data.descripcion ?? row.descripcion,
    porcentaje_descuento:
      data.porcentaje_descuento ?? row.porcentaje_descuento,
    condiciones: data.condiciones ?? row.condiciones,
    dias_aplica: Array.isArray(data.dias_aplica)
      ? data.dias_aplica
      : row.dias_aplica,
    horario_aplica: data.horario_aplica ?? row.horario_aplica,
    sucursal_id: data.sucursal_id ?? row.sucursal_id,
    aplica_todas_sucursales:
      typeof data.aplica_todas_sucursales === "boolean"
        ? data.aplica_todas_sucursales
        : row.aplica_todas_sucursales,
    medio_pago: data.medio_pago ?? row.medio_pago,
    entidad: data.entidad ?? row.entidad,
    mensaje_bot: data.mensaje_bot ?? row.mensaje_bot,
    aliases: Array.isArray(data.aliases) ? data.aliases : row.aliases,
    activo_bot:
      typeof data.activo_bot === "boolean"
        ? data.activo_bot
        : row.activo_bot,
    prioridad:
      data.prioridad !== undefined
        ? Number(data.prioridad || 0)
        : row.prioridad,
  });

  return getBotBenefitMetaById(id);
}

export async function deleteBotBenefitMeta(id) {
  const row = await BotBenefitMeta.findByPk(id);

  if (!row) return false;

  await row.destroy();

  return true;
}

export async function searchBenefitMetaCandidates(text = "", limit = 3) {
  const q = normalizeText(text);

  const asksCardBenefit =
    q.includes("tarjeta") ||
    q.includes("banco") ||
    q.includes("naranja") ||
    q.includes("marcaton") ||
    q.includes("marcatón") ||
    q.includes("reintegro") ||
    q.includes("cuotas") ||
    q.includes("plan z");

  const safeLimit = Math.min(Number(limit || 3), 5);

  let rows = await BotBenefitMeta.findAll({
    where: { activo_bot: true },
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

  if (asksCardBenefit) {
    rows = rows.filter(
      (row) =>
        normalizeText(row.tipo_beneficio || "") === "reintegro"
    );
  }

  const scored = rows
    .map((row) => {
      const data = row.toJSON();

      const aliases = Array.isArray(data.aliases)
        ? data.aliases.map((a) => normalizeText(a))
        : [];

      const titulo = normalizeText(data.titulo || "");
      const tipo = normalizeText(data.tipo_beneficio || "");
      const descripcion = normalizeText(data.descripcion || "");
      const mensaje = normalizeText(data.mensaje_bot || "");

      let score = 0;

      if (aliases.includes(q)) score += 100;
      if (titulo === q) score += 90;
      if (tipo === q) score += 80;

      // Prioridad fuerte para consultas específicas
      if (
        q.includes("marcaton") ||
        q.includes("marcatón") ||
        q.includes("naranja") ||
        q.includes("centrocard") ||
        q.includes("plan z")
      ) {
        if (
          titulo.includes(q) ||
          aliases.some((alias) => alias.includes(q))
        ) {
          score += 300;
        }
      }

      if (aliases.some((alias) => q.includes(alias) || alias.includes(q))) {
        score += 60;
      }

      if (titulo.includes(q) || q.includes(titulo)) {
        score += 50;
      }

      const words = q
        .split(" ")
        .map((w) => w.trim())
        .filter((word) => word.length >= 4);

      for (const word of words) {
        if (aliases.some((alias) => alias.includes(word))) score += 12;
        if (titulo.includes(word)) score += 10;
        if (tipo.includes(word)) score += 8;
        if (descripcion.includes(word)) score += 3;
        if (mensaje.includes(word)) score += 3;
      }

      score += Number(data.prioridad || 0) / 100;

      return { row, score };
    })
    .filter((item) => item.score >= 10)
    .sort((a, b) => b.score - a.score);

  const bestScore = scored[0]?.score || 0;

  const filtered = scored.filter(
    (item) => item.score >= bestScore * 0.65
  );

  return filtered
    .slice(0, safeLimit)
    .map((item) => item.row);
}

export function buildBenefitReply(benefits = []) {
  if (!Array.isArray(benefits) || benefits.length === 0) {
    return null;
  }

  const lines = benefits.map((benefit) => {
    const data = benefit.toJSON ? benefit.toJSON() : benefit;

    const parts = [];

    parts.push(`• ${data.titulo}`);

    if (data.porcentaje_descuento) {
      parts.push(`Descuento: ${Number(data.porcentaje_descuento)}%`);
    }

    if (Array.isArray(data.dias_aplica) && data.dias_aplica.length > 0) {
      parts.push(`Días: ${data.dias_aplica.join(", ")}`);
    }

    if (data.medio_pago) {
      parts.push(`Medio de pago: ${data.medio_pago}`);
    }

    if (data.entidad) {
      parts.push(`Entidad: ${data.entidad}`);
    }

    if (data.condiciones) {
      parts.push(`Condiciones: ${data.condiciones}`);
    }

    if (data.mensaje_bot) {
      parts.push(data.mensaje_bot);
    }

    return parts.join("\n  ");
  });

  return `Estos son los beneficios que encontré:\n\n${lines.join(
    "\n\n"
  )}\n\n¿Querés que te detalle alguno en particular?`;
}

export default {
  listBotBenefitMeta,
  getBotBenefitMetaById,
  createBotBenefitMeta,
  updateBotBenefitMeta,
  deleteBotBenefitMeta,
  searchBenefitMetaCandidates,
  buildBenefitReply,
};