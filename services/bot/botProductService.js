import { Op } from "sequelize";
import BotProductMeta from "../../models/bot/botProductMetaModel.js";
import ArticuloTabla from "../../models/tablas/articuloModel.js";
import normalizeText from "../../utils/bot/normalizeText.js";
import { normalizeCutQueryWithOpenAI } from "./botCutNormalizerService.js";

function asArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function tokenize(text = "") {
  return normalizeText(text)
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 3)
    .filter((t) => !["para", "quiero", "cuanto", "sale", "precio", "tenes", "tienen", "kilo", "algo"].includes(t));
}

function includesAny(text, words = []) {
  return words.some((word) => text.includes(normalizeText(word)));
}

function buildSearchFields(row) {
  const platos = asArray(row.platos_recomendados).map(normalizeText);
  const metodos = asArray(row.metodos_coccion).map(normalizeText);
  const tags = asArray(row.tags_busqueda).map(normalizeText);
  const alternativas = asArray(row.alternativas).map(normalizeText);

  return [
    normalizeText(row.nombre_visible),
    normalizeText(row.descripcion_corta || ""),
    normalizeText(row.recomendacion_comercial || ""),
    normalizeText(row.articulo?.descripcion || ""),
    normalizeText(row.articulo?.descripcionreducida || ""),
    normalizeText(row.terneza || ""),
    normalizeText(row.rendimiento || ""),
    normalizeText(row.precio_nivel || ""),
    ...platos,
    ...metodos,
    ...tags,
    ...alternativas,
  ].filter(Boolean);
}

function scoreProduct(row, queryText) {
  const normalized = normalizeText(queryText);
  const tokens = tokenize(queryText);
  const fields = buildSearchFields(row);
  const joined = fields.join(" ");

  let score = Number(row.prioridad || 0);

  for (const field of fields) {
    if (field && normalized.includes(field) && field.length >= 3) score += 10;
    if (field && field.includes(normalized) && normalized.length >= 3) score += 8;
  }

  for (const token of tokens) {
    if (joined.includes(token)) score += 3;
  }

  const platos = asArray(row.platos_recomendados).map(normalizeText);
  const metodos = asArray(row.metodos_coccion).map(normalizeText);
  const tags = asArray(row.tags_busqueda).map(normalizeText);

  const semanticRules = [
    { query: ["milanesa", "milanesas"], target: platos, value: 12 },
    { query: ["parrilla", "asado", "asar"], target: metodos, value: 12 },
    { query: ["horno"], target: metodos, value: 10 },
    { query: ["plancha"], target: metodos, value: 10 },
    { query: ["guiso"], target: platos, value: 10 },
    { query: ["estofado"], target: platos, value: 10 },
    { query: ["empanada", "empanadas"], target: platos, value: 10 },
    { query: ["hamburguesa", "hamburguesas"], target: platos, value: 10 },
    { query: ["tierno", "blando", "suave"], target: [normalizeText(row.terneza || ""), ...tags], value: 8 },
    { query: ["economico", "barato", "conviene"], target: [normalizeText(row.precio_nivel || ""), ...tags], value: 8 },
    { query: ["rendidor", "rinde"], target: [normalizeText(row.rendimiento || ""), ...tags], value: 8 },
  ];

  for (const rule of semanticRules) {
    if (includesAny(normalized, rule.query) && rule.target.some((target) => rule.query.some((q) => target.includes(normalizeText(q))) || target.length > 0)) {
      score += rule.value;
    }
  }

  return score;
}

function normalizeBotText(text = "") {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[¿?¡!.,;:()"]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractProductQuery(text = "") {
  const clean = normalizeBotText(text);

  return clean
    .replace(/\b(dime|decime|pasame|quiero|saber|el|la|los|las|un|una|de|del|precio|cuanto|cuesta|sale|valor|kilo|kg|por)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function searchProductAdviceCandidates(text = "", limit = 30) {
  const cleanText = String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

  const allMeta = await BotProductMeta.findAll({
    where: {
      activo_bot: true,
    },
    include: [
      {
        model: ArticuloTabla,
        as: "articulo",
        required: false,
      },
    ],
    order: [
      ["prioridad", "DESC"],
      ["id", "ASC"],
    ],
  });

  const productQuery = extractProductQuery(text);

  if (productQuery) {
    const exactMatches = allMeta.filter((item) => {
      const exactValues = [
        item.nombre_visible,
        item.articulo?.descripcion,
        item.articulo?.descripcionreducida,
        ...(Array.isArray(item.aliases) ? item.aliases : []),
      ]
        .filter(Boolean)
        .map(normalizeBotText);

      return exactValues.includes(productQuery);
    });

    if (exactMatches.length > 0) {
      return exactMatches.slice(0, limit);
    }
  }
  const knownProducts = allMeta.map((item) => ({
    articulo_id: item.articulo_id,
    nombre_visible: item.nombre_visible,
    articulo_descripcion: item.articulo?.descripcion || null,
    aliases: item.aliases || [],
    tags_busqueda: item.tags_busqueda || [],
  }));

  const knownAliases = allMeta.flatMap((item) =>
    Array.isArray(item.aliases)
      ? item.aliases.map((alias) => ({
        alias,
        articulo_id: item.articulo_id,
        nombre_visible: item.nombre_visible,
      }))
      : []
  );

  const normalized = await normalizeCutQueryWithOpenAI({
    userMessage: text,
    knownAliases,
    knownProducts,
  });

  const searchTerms = [
    cleanText,
    normalized?.producto_buscado,
    normalized?.alias_detectado,
    normalized?.uso_detectado,
    ...(normalized?.terminos_busqueda || []),
  ]
    .filter(Boolean)
    .map((term) =>
      String(term)
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
    );

  const scoreItem = (item) => {
    const fields = [
      item.nombre_visible,
      item.descripcion_corta,
      item.recomendacion_comercial,
      item.terneza,
      item.rendimiento,
      item.precio_nivel,
      item.articulo?.descripcion,
      item.articulo?.descripcionreducida,
      ...(Array.isArray(item.aliases) ? item.aliases : []),
      ...(Array.isArray(item.tags_busqueda) ? item.tags_busqueda : []),
      ...(Array.isArray(item.platos_recomendados) ? item.platos_recomendados : []),
      ...(Array.isArray(item.metodos_coccion) ? item.metodos_coccion : []),
      ...(Array.isArray(item.alternativas) ? item.alternativas : []),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    let score = Number(item.prioridad || 0);

    for (const term of searchTerms) {
      if (!term) continue;

      const exactValues = [
        item.nombre_visible,
        item.articulo?.descripcion,
        item.articulo?.descripcionreducida,
        ...(Array.isArray(item.aliases) ? item.aliases : []),
      ]
        .filter(Boolean)
        .map((value) =>
          String(value)
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .trim()
        );

      const isExactMatch = exactValues.includes(term);

      if (isExactMatch) {
        score += 50;
      } else {
        const tagValues = [
          ...(Array.isArray(item.tags_busqueda) ? item.tags_busqueda : []),
          ...(Array.isArray(item.platos_recomendados) ? item.platos_recomendados : []),
          ...(Array.isArray(item.metodos_coccion) ? item.metodos_coccion : []),
        ]
          .filter(Boolean)
          .map((value) =>
            String(value)
              .toLowerCase()
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "")
              .trim()
          );

        if (tagValues.includes(term)) {
          score += 20;
        }
      }
    }

    if (
      normalized?.confianza >= 0.7 &&
      normalized?.producto_buscado &&
      fields.includes(
        String(normalized.producto_buscado)
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
      )
    ) {
      score += 20;
    }

    return score;
  };

  const scored = allMeta
    .map((item) => ({
      item,
      score: scoreItem(item),
    }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((row) => row.item);

  return scored;
}

export async function listBotProductMeta(filters = {}) {
  const where = {};

  if (typeof filters.activo_bot !== "undefined") where.activo_bot = filters.activo_bot;

  if (filters.q) {
    where[Op.or] = [
      { nombre_visible: { [Op.iLike]: `%${filters.q}%` } },
      { descripcion_corta: { [Op.iLike]: `%${filters.q}%` } },
    ];
  }

  return BotProductMeta.findAll({
    where,
    include: [{ model: ArticuloTabla, as: "articulo" }],
    order: [
      ["prioridad", "DESC"],
      ["nombre_visible", "ASC"],
    ],
  });
}

export async function getBotProductMetaById(id) {
  return BotProductMeta.findByPk(id, { include: [{ model: ArticuloTabla, as: "articulo" }] });
}

export async function createBotProductMeta(data) {
  return BotProductMeta.create(data);
}

export async function updateBotProductMeta(id, data) {
  const row = await BotProductMeta.findByPk(id);
  if (!row) return null;
  await row.update(data);
  return row;
}

export async function deleteBotProductMeta(id) {
  const row = await BotProductMeta.findByPk(id);
  if (!row) return false;
  await row.destroy();
  return true;
}

export default {
  searchProductAdviceCandidates,
  listBotProductMeta,
  getBotProductMetaById,
  createBotProductMeta,
  updateBotProductMeta,
  deleteBotProductMeta,
};
