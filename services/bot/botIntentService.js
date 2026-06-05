import { BOT_INTENTS } from "../../utils/bot/botConstants.js";
import { extractBotEntities } from "./botEntityExtractorService.js";
function normalizeText(text = "") {
  return String(text)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[¿?¡!.,;:()"]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function includesAny(text, words = []) {
  return words.some((word) => text.includes(word));
}

function scoreIntent(text, rules = []) {
  let score = 0;

  for (const rule of rules) {
    if (typeof rule === "string" && text.includes(normalizeText(rule))) {
      score += 1;
    }

    if (rule instanceof RegExp && rule.test(text)) {
      score += 2;
    }
  }

  return score;
}

const INTENT_RULES = {
  [BOT_INTENTS.GREETING]: [
    /^hola\b/,
    /^buen dia\b/,
    /^buenas\b/,
    "buenas tardes",
    "buenas noches",
    "como estan",
    "hay alguien",
  ],

  [BOT_INTENTS.PRICE]: [
    "precio",
    "cuanto sale",
    "cuanto cuesta",
    "cuanto esta",
    "a cuanto",
    "valor",
    "lista de precio",
    "me pasas precio",
    "sale el kilo",
    "esta el kilo",
    /\$ ?\d+/,
  ],

  [BOT_INTENTS.PRODUCT_ADVICE]: [
    "recomendas",
    "que me aconsejas",
    "que me conviene",
    "que corte",
    "para milanesa",
    "para milanesas",
    "para parrilla",
    "para horno",
    "para guiso",
    "para estofado",
    "para puchero",
    "para bifes",
    "para empanadas",
    "para hamburguesa",
    "algo tierno",
    "algo economico",
    "algo rendidor",
    "algo barato",
    "que puedo llevar",
    "tenes algo para",
    "que puedo cocinar",
    "que puedo hacer",
    "como cocinar",
    "como preparo",
    "como preparar",
    "que receta",
    "alguna receta",
    "receta para",
    "receta con",
    "cocinar con",
    "preparar con",
  ],

  [BOT_INTENTS.PROMOTIONS]: [
    "promo",
    "promocion",
    "promociones",
    "oferta",
    "ofertas",
    "barato hoy",
    "que esta en promo",
    "que hay en oferta",
  ],

  [BOT_INTENTS.STOCK]: [
    "tenes stock",
    "hay stock",
    "te queda",
    "queda",
    "disponible",
    "disponibilidad",
    "hay en sucursal",
    "hay en la sucursal",
  ],

  [BOT_INTENTS.BRANCHES]: [
    "sucursal",
    "sucursales",
    "direccion",
    "ubicacion",
    "donde queda",
    "cerca",
    "telefono sucursal",
    "numero sucursal",
    "horario",
    "horarios",
    "hora de atencion",
  ],

  [BOT_INTENTS.PAYMENTS]: [
    "tarjeta",
    "credito",
    "debito",
    "transferencia",
    "efectivo",
    "mercado pago",
    "medio de pago",
    "forma de pago",
  ],

  [BOT_INTENTS.BENEFITS]: [
    "beneficio",
    "beneficios",
    "descuento",
    "descuentos",
    "convenio",
    "convenios",
    "jubilado",
    "jubilados",
    "pensionado",
    "pensionados",
    "sindicato",
    "sindicatos",
    "tarjeta naranja",
    "naranja",
    "centrocard",
    "reintegro",
    "reintegros",
    "banco",
    "promocion bancaria",
    "promo bancaria",
    "institucion",
    "afiliado",
    "afiliados",
    "club",
    "puntos",
    "club de puntos",
    "acumular puntos",
    "cumple",
    "cumpleañero",
    "cumpleañeros",
    "cumpleanos",
    "cumpleaños",
    "promo cumple",
    "promo cumpleanos",
    "promo cumpleaños",
    "promocion cumple",
    "promocion cumpleanos",
    "promocion cumpleaños",
    "descuento cumple",
    "descuento cumpleanos",
    "descuento cumpleaños",
  ],

  [BOT_INTENTS.EVENTS]: [
    "evento",
    "eventos",
    "feriado",
    "feriados",
    "abren el feriado",
    "atienden el feriado",
    "trabajan el feriado",
    "hoy abren",
    "hoy trabajan",
    "hoy atienden",
    "mañana abren",
    "manana abren",
    "cerrado",
    "cerrados",
    "cierran",
    "cierre",
    "capacitacion",
    "capacitación",
    "sorteo",
    "sorteos",
    "degustacion",
    "degustación",
    "dia del niño",
    "día del niño",
    "dia del trabajador",
    "día del trabajador",
    "horario especial",
    "1 de mayo",
    "navidad",
    "año nuevo",
    "ano nuevo",
  ],

  [BOT_INTENTS.HUMAN_HANDOFF]: [
    "quiero hablar",
    "me atiende una persona",
    "humano",
    "vendedor",
    "encargado",
    "atencion",
    "llamame",
    "necesito hablar",
  ],

  [BOT_INTENTS.COMPLAINT]: [
    "reclamo",
    "queja",
    "problema",
    "mala atencion",
    "mal estado",
    "me vino mal",
    "me cobraron mal",
    "no me gusto",
  ],
};

export function extractCommercialSignals(text = "") {
  const normalizedText = normalizeText(text);

  return {
    normalizedText,

    wantsCheap: includesAny(normalizedText, [
      "barato",
      "economico",
      "mas economico",
      "cuidar precio",
      "buen precio",
      "oferta",
      "promo",
    ]),

    wantsTender: includesAny(normalizedText, [
      "tierno",
      "tierna",
      "blando",
      "blandito",
      "suave",
    ]),

    wantsYield: includesAny(normalizedText, [
      "rendidor",
      "rinde",
      "rendir",
      "familia",
      "muchos",
      "varias comidas",
    ]),

    wantsPromotion: includesAny(normalizedText, [
      "promo",
      "promocion",
      "oferta",
    ]),

    wantsBenefit: includesAny(normalizedText, [
      "beneficio",
      "beneficios",
      "descuento",
      "descuentos",
      "jubilado",
      "jubilados",
      "sindicato",
      "convenio",
      "convenios",
      "naranja",
      "centrocard",
      "reintegro",
      "club",
      "puntos",
      "club de puntos",
      "cumple",
      "cumpleanos",
      "cumpleaños",
      "promo cumple",
      "promo cumpleanos",
      "promo cumpleaños",
      "promocion cumple",
      "promocion cumpleanos",
      "promocion cumpleaños",
      "descuento cumple",
      "descuento cumpleanos",
      "descuento cumpleaños",
      "tarjeta",
      "banco",
      "marcaton",
      "marcatón",
      "cuotas",
      "plan z",
      "medio de pago",
    ]),

    wantsEvent: includesAny(normalizedText, [
      "feriado",
      "cerrado",
      "abren",
      "atienden",
      "trabajan",
      "capacitacion",
      "sorteo",
      "degustacion",
      "evento",
      "dia del niño",
      "dia del trabajador",
      "horario especial",
    ]),

    cookingMethod: detectCookingMethod(normalizedText),
    dish: detectDish(normalizedText),
  };
}

function detectCookingMethod(text) {
  if (includesAny(text, ["parrilla", "asado", "brasas"])) return "parrilla";
  if (includesAny(text, ["horno", "horneado"])) return "horno";
  if (includesAny(text, ["plancha", "bife", "bifes"])) return "plancha";
  if (includesAny(text, ["olla", "guiso", "estofado", "puchero"])) return "olla";
  if (includesAny(text, ["milanesa", "milanesas", "freir", "frito"])) return "milanesas";
  return null;
}

function detectDish(text) {
  if (includesAny(text, ["milanesa", "milanesas"])) return "milanesas";
  if (includesAny(text, ["asado", "parrilla"])) return "asado";
  if (includesAny(text, ["guiso", "estofado"])) return "guiso";
  if (includesAny(text, ["puchero"])) return "puchero";
  if (includesAny(text, ["empanada", "empanadas"])) return "empanadas";
  if (includesAny(text, ["hamburguesa", "hamburguesas"])) return "hamburguesas";
  return null;
}

function isFollowUpQuestion(text) {
  return includesAny(text, [
    "mas barato",
    "mas economico",
    "mas tierno",
    "mas rendidor",
    "y otro",
    "y otra",
    "otra opcion",
    "otra cosa",
    "cual conviene",
    "cual me recomendas",
    "ese",
    "esa",
    "cuanto sale",
    "y el precio",
  ]);
}

function isBenefitPriorityQuery(text) {
  return (
    /\b(cumple|cumpleanos|cumpleaños)\b/.test(text) ||
    /\b(jubilado|jubilados|pensionado|pensionados)\b/.test(text) ||
    /\b(club|puntos|club de puntos|somos mas|somos más)\b/.test(text) ||
    /\b(convenio|convenios|sindicato|sindicatos|afiliado|afiliados)\b/.test(text) ||
    /\b(beneficio|beneficios|descuento|descuentos|reintegro|reintegros)\b/.test(text) ||
    /\b(naranja|centrocard|banco)\b/.test(text)
  );
}

function isGeneralPromotionQuery(text) {
  return (
    /\b(promo|promos|promocion|promociones|oferta|ofertas)\b/.test(text) ||
    text.includes("que hay hoy") ||
    text.includes("hay algo hoy") ||
    text.includes("ofertas de hoy") ||
    text.includes("promos de hoy") ||
    text.includes("promociones de hoy") ||
    text.includes("que esta en promo")
  );
}

export function detectIntent(text = "", context = {}) {
  const normalizedText = normalizeText(text);
  const entities = extractBotEntities(text);

  if (!normalizedText) {
    return BOT_INTENTS.FALLBACK;
  }

  if (entities.asksOpeningStatus && entities.mentionsSpecialDate) {
    return BOT_INTENTS.EVENTS;
  }

  if (entities.asksSchedule && !entities.mentionsSpecialDate) {
    return BOT_INTENTS.BRANCHES;
  }

  const scores = {};

  Object.entries(INTENT_RULES).forEach(([intent, rules]) => {
    scores[intent] = scoreIntent(normalizedText, rules);
  });

  const signals = extractCommercialSignals(normalizedText);

  const asksBenefits = isBenefitPriorityQuery(normalizedText);

  const asksCardBenefit =
    normalizedText.includes("tarjeta") ||
    normalizedText.includes("banco") ||
    normalizedText.includes("marcaton") ||
    normalizedText.includes("marcatón") ||
    normalizedText.includes("naranja") ||
    normalizedText.includes("centrocard") ||
    normalizedText.includes("reintegro") ||
    normalizedText.includes("cuotas") ||
    normalizedText.includes("plan z") ||
    normalizedText.includes("medio de pago");


  const asksPromotions = isGeneralPromotionQuery(normalizedText);

  if (asksBenefits || asksCardBenefit) {
    scores[BOT_INTENTS.BENEFITS] =
      (scores[BOT_INTENTS.BENEFITS] || 0) + 20;

    scores[BOT_INTENTS.PROMOTIONS] = 0;
  } else if (asksPromotions) {
    scores[BOT_INTENTS.PROMOTIONS] =
      (scores[BOT_INTENTS.PROMOTIONS] || 0) + 12;
  }

  if (signals.wantsEvent) {
    scores[BOT_INTENTS.EVENTS] = (scores[BOT_INTENTS.EVENTS] || 0) + 4;
  }

  if (signals.wantsBenefit) {
    scores[BOT_INTENTS.BENEFITS] =
      (scores[BOT_INTENTS.BENEFITS] || 0) + 8;

    scores[BOT_INTENTS.PROMOTIONS] = Math.min(
      scores[BOT_INTENTS.PROMOTIONS] || 0,
      1
    );
  }

  if (signals.wantsPromotion && !signals.wantsBenefit && !asksBenefits) {
    scores[BOT_INTENTS.PROMOTIONS] =
      (scores[BOT_INTENTS.PROMOTIONS] || 0) + 5;
  }

  const hasPriceIntent =
    /\b(precio|precios|cuanto|vale|sale|cuesta|costo|valor|kg|kilo)\b/.test(
      normalizedText
    );

  if (hasPriceIntent) {
    scores[BOT_INTENTS.PRICE] = (scores[BOT_INTENTS.PRICE] || 0) + 5;
  }

  const asksRecipe =
    normalizedText.includes("receta") ||
    normalizedText.includes("cocinar") ||
    normalizedText.includes("preparar") ||
    normalizedText.includes("como hago") ||
    normalizedText.includes("como preparo") ||
    normalizedText.includes("que puedo cocinar") ||
    normalizedText.includes("que puedo hacer");

  if (
    asksRecipe ||
    signals.dish ||
    signals.cookingMethod ||
    signals.wantsCheap ||
    signals.wantsTender ||
    signals.wantsYield
  ) {
    scores[BOT_INTENTS.PRODUCT_ADVICE] =
      (scores[BOT_INTENTS.PRODUCT_ADVICE] || 0) + 3;
  }

  if (isFollowUpQuestion(normalizedText) && context?.ultima_intencion) {
    if (
      [
        BOT_INTENTS.PRODUCT_ADVICE,
        BOT_INTENTS.PRICE,
        BOT_INTENTS.PROMOTIONS,
        BOT_INTENTS.BENEFITS,
        BOT_INTENTS.EVENTS,
        BOT_INTENTS.BRANCHES,
      ].includes(context.ultima_intencion)
    ) {
      scores[context.ultima_intencion] =
        (scores[context.ultima_intencion] || 0) + 2;
    }
  }

  if (asksBenefits || signals.wantsBenefit) {
    return BOT_INTENTS.BENEFITS;
  }

  const greetingScore = scores[BOT_INTENTS.GREETING] || 0;

  const commercialPriority = [
    BOT_INTENTS.PRICE,
    BOT_INTENTS.BENEFITS,
    BOT_INTENTS.PROMOTIONS,
    BOT_INTENTS.EVENTS,
    BOT_INTENTS.PRODUCT_ADVICE,
    BOT_INTENTS.BRANCHES,
  ];

  for (const intent of commercialPriority) {
    if ((scores[intent] || 0) > 0 && greetingScore > 0) {
      return intent;
    }
  }

  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const [bestIntent, bestScore] = ranked[0] || [];

  if (!bestIntent || bestScore <= 0) {
    return BOT_INTENTS.FALLBACK;
  }

  if (bestIntent === BOT_INTENTS.GREETING) {
    const better = ranked.find(
      ([intent, score]) => intent !== BOT_INTENTS.GREETING && score > 0
    );

    if (better) {
      return better[0];
    }
  }

  return bestIntent;
}

export default {
  detectIntent,
  extractCommercialSignals,
};