import { BOT_INTENTS, BOT_MESSAGE_DIRECTION, BOT_MESSAGE_TYPE } from "../../utils/bot/botConstants.js";

import { getBotSettings } from "./botConfigService.js";
import { detectIntent, extractCommercialSignals } from "./botIntentService.js";
import { searchProductAdviceCandidates } from "./botProductService.js";
import { getProductPrices, getActivePromotionProductsForBot } from "./botPricingService.js";
import { buildAdviceWithOpenAI } from "./botOpenAIService.js";
import {
  searchEventMetaCandidates,
  buildEventReply,
} from "./botEventService.js";
import { createHandoff } from "./botHandoffService.js";
import { addMessage } from "./botConversationService.js";
import BotMessage from "../../models/bot/botMessageModel.js";
import { searchBranchMetaCandidates, getAllActiveBranchMeta } from "./botBranchService.js";
import {
  searchBenefitMetaCandidates,
  buildBenefitReply,
} from "./botBenefitService.js";
import { extractBotEntities } from "./botEntityExtractorService.js";

function money(value) {
  if (
    value === null ||
    typeof value === "undefined" ||
    Number.isNaN(Number(value))
  ) {
    return null;
  }

  return Number(value).toLocaleString("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function normalizeText(text = "") {
  return String(text)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[¿?¡!.,;:()"]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function addDays(date, days) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function getNextWeekday(targetDay) {
  const today = new Date();
  const currentDay = today.getDay();
  const diff = (targetDay - currentDay + 7) % 7 || 7;
  return addDays(today, diff);
}

function formatDateOnly(date) {
  return date.toISOString().split("T")[0];
}

function resolvePromotionDateContext(text = "") {
  const clean = normalizeText(text);

  if (
    clean.includes("fin de semana") ||
    clean.includes("finde") ||
    clean.includes("sabado y domingo") ||
    clean.includes("sábado y domingo")
  ) {
    return {
      type: "weekend",
      label: "para el fin de semana",
      dates: [
        getNextWeekday(6), // sábado
        getNextWeekday(0), // domingo
      ],
    };
  }

  if (clean.includes("sabado") || clean.includes("sábado")) {
    return {
      type: "single",
      label: "para el sábado",
      dates: [getNextWeekday(6)],
    };
  }

  if (clean.includes("domingo")) {
    return {
      type: "single",
      label: "para el domingo",
      dates: [getNextWeekday(0)],
    };
  }

  if (clean.includes("mañana") || clean.includes("manana")) {
    return {
      type: "single",
      label: "para mañana",
      dates: [addDays(new Date(), 1)],
    };
  }

  return {
    type: "today",
    label: "vigentes para hoy",
    dates: [new Date()],
  };
}

function mergePromotionItems(items = []) {
  const map = new Map();

  for (const item of items) {
    const key = [
      item.promocion_id,
      item.articulo_id,
      item.precio_final,
      item.precio_normal,
    ].join("-");

    if (!map.has(key)) {
      map.set(key, item);
    }
  }

  return Array.from(map.values());
}

function buildSimpleProductReply(candidates = [], pricing = [], intent = null) {
  const pricingMap = new Map(pricing.map((p) => [Number(p.articulo_id), p]));

  const lines = candidates.slice(0, 50).map((item) => {
    const articuloId = Number(item.articulo_id);
    const price = pricingMap.get(articuloId);
    const finalPrice = money(price?.precio_final);
    const normalPrice = money(price?.precio_normal);
    const promoText = price?.tiene_promocion ? " con promo" : "";

    let priceText = "";
    if (finalPrice) priceText = ` – $${finalPrice}${promoText}`;
    else if (normalPrice) priceText = ` – $${normalPrice}`;

    return `• ${item.nombre_visible}${priceText}. ${item.recomendacion_comercial || item.descripcion_corta || ""
      }`.trim();
  });

  const close =
    intent === BOT_INTENTS.PRICE
      ? "¿Querés que te sugiera una opción más económica o más tierna?"
      : "¿Buscás algo más tierno, más económico o más rendidor?";

  return `${lines.join("\n")}\n\n${close}`;
}

function buildPromotionProductsReply(items = [], label = "vigentes para hoy") {
  if (!Array.isArray(items) || items.length === 0) {
    return `Por el momento no tengo artículos en promoción ${label}.`;
  }

  const lines = items.map((item, index) => {
    const nombre = item.articulo_nombre || `Artículo ${item.articulo_id}`;

    const precioPromo =
      item.precio_final !== null && typeof item.precio_final !== "undefined"
        ? `Precio promo: $${money(item.precio_final)}`
        : "";

    const precioAntes =
      item.precio_normal !== null &&
        typeof item.precio_normal !== "undefined" &&
        Number(item.precio_normal) !== Number(item.precio_final)
        ? `Antes: $${money(item.precio_normal)}`
        : "";

    return [`${index + 1}. ${nombre}`, precioPromo, precioAntes]
      .filter(Boolean)
      .join("\n   ");
  });

  return [
    `Estas son las promociones ${label}:`,
    "",
    ...lines,
    "",
    "Los precios pueden variar según sucursal o lista de precios.",
  ].join("\n");
}

// function buildPromotionProductsReply(items = []) {
//   if (!Array.isArray(items) || items.length === 0) {
//     return "Por el momento no tengo artículos en promoción vigentes para hoy.";
//   }

//   const lines = items.map((item, index) => {
//     const nombre = item.articulo_nombre || `Artículo ${item.articulo_id}`;

//     const precioPromo =
//       item.precio_final !== null && typeof item.precio_final !== "undefined"
//         ? `Precio promo: $${money(item.precio_final)}`
//         : "";

//     const precioAntes =
//       item.precio_normal !== null &&
//       typeof item.precio_normal !== "undefined" &&
//       Number(item.precio_normal) !== Number(item.precio_final)
//         ? `Antes: $${money(item.precio_normal)}`
//         : "";

//     return [
//       `${index + 1}. ${nombre}`,
//       precioPromo,
//       precioAntes,
//     ]
//       .filter(Boolean)
//       .join("\n   ");
//   });

//   return [
//     "Estas son las promociones vigentes de artículos para hoy:",
//     "",
//     ...lines,
//     "",
//     "Los precios pueden variar según sucursal o lista de precios.",
//   ].join("\n");
// }

function buildAskBranchContactReply() {
  return [
    "No tengo ese dato exacto cargado en este momento.",
    "",
    "Para confirmarlo directamente con el local, decime qué sucursal querés contactar y te paso teléfono, dirección, horario y ubicación.",
  ].join("\n");
}

function buildBranchContactReply(branch) {
  const data = branch?.toJSON ? branch.toJSON() : branch;

  if (!data) {
    return "No pude identificar esa sucursal. Decime el nombre de la sucursal o la zona.";
  }

  return [
    `${data.nombre_visible || "Sucursal"}`,
    data.zona ? `Zona: ${data.zona}` : "",
    data.direccion ? `📍 Dirección: ${data.direccion}` : "",
    data.telefono ? `📞 Teléfono: ${data.telefono}` : "",
    data.horario_atencion ? `🕘 Horario: ${data.horario_atencion}` : "",
    data.google_maps_url ? `🗺️ Ubicación: ${data.google_maps_url}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function buildBranchOptionsPayload(branchCandidates = []) {
  return branchCandidates.map((branch) =>
    branch.toJSON ? branch.toJSON() : branch
  );
}

function buildBranchOptionsReply(branchCandidates = []) {
  if (!branchCandidates.length) {
    return "No encontré sucursales cargadas en este momento.";
  }

  const options = branchCandidates.map((branch, index) => {
    const data = branch.toJSON ? branch.toJSON() : branch;
    const zona = data.zona ? ` - ${data.zona}` : "";
    const direccion = data.direccion ? `\n   Dirección: ${data.direccion}` : "";

    return `${index + 1}. ${data.nombre_visible}${zona}${direccion}`;
  });

  return `Encontré estas sucursales:\n\n${options.join(
    "\n"
  )}\n\nRespondé con el número de la sucursal y te paso teléfono, dirección, horario y ubicación.`;
}

function buildAllBranchesReply(branchCandidates = []) {
  if (!branchCandidates.length) {
    return "No encontré sucursales cargadas en este momento.";
  }

  const lines = branchCandidates.map((branch, index) => {
    const data = branch.toJSON ? branch.toJSON() : branch;

    return [
      `${index + 1}. ${data.nombre_visible || "Sucursal"}`,
      data.zona ? `Zona: ${data.zona}` : "",
      data.direccion ? `📍 ${data.direccion}` : "",
    ]
      .filter(Boolean)
      .join("\n   ");
  });

  return [
    "Estas son nuestras sucursales:",
    "",
    ...lines,
    "",
    "Respondé con el número de la sucursal y te paso teléfono, dirección, horario y ubicación.",
  ].join("\n");
}

function isUnknownDetailQuestion(text = "") {
  const clean = normalizeText(text);

  return (
    clean.includes("que tiene") ||
    clean.includes("que trae") ||
    clean.includes("contiene") ||
    clean.includes("incluye") ||
    clean.includes("composicion") ||
    clean.includes("detalle exacto") ||
    clean.includes("que viene") ||
    clean.includes("como viene")
  );
}

function aiPromisedInternalContact(text = "") {
  const clean = normalizeText(text);

  return (
    clean.includes("te lo consulto") ||
    clean.includes("consulto ahora") ||
    clean.includes("consulto con") ||
    clean.includes("te confirmo") ||
    clean.includes("lo confirmo") ||
    clean.includes("apenas me") ||
    clean.includes("te paso el detalle") ||
    clean.includes("confirmo con la sucursal") ||
    clean.includes("te derivo") ||
    clean.includes("derivo con") ||
    clean.includes("derivarte") ||
    clean.includes("te los gestione") ||
    clean.includes("gestionar ahora") ||
    clean.includes("compartamos el numero") ||
    clean.includes("que te llamen")
  );
}

function isOrderClosingMessage(text = "") {
  const clean = normalizeText(text);

  return (
    /\b\d+\s*(kg|kilo|kilos|gramos|gr)\b/.test(clean) ||
    clean.includes("paso hoy") ||
    clean.includes("paso mañana") ||
    clean.includes("paso manana") ||
    clean.includes("voy a retirar") ||
    clean.includes("retiro") ||
    clean.includes("retirar") ||
    clean.includes("dejame") ||
    clean.includes("separame") ||
    clean.includes("reservame") ||
    clean.includes("preparame") ||
    clean.includes("armame")
  );
}

function isScheduleQuery(text = "") {
  const clean = normalizeText(text);

  return (
    clean.includes("horario") ||
    clean.includes("horarios") ||
    clean.includes("hora de atencion") ||
    clean.includes("horas de atencion") ||
    clean.includes("a que hora abren") ||
    clean.includes("a que hora cierran") ||
    clean.includes("atienden")
  );
}

function isAffirmative(text = "") {
  const clean = normalizeText(text);

  return [
    "si",
    "sí",
    "dale",
    "ok",
    "bueno",
    "perfecto",
    "claro",
    "de una",
  ].includes(clean);
}

function lastBotAskedScheduleFlow(messages = []) {
  return messages.some((m) => {
    const text = normalizeText(m.text || "");

    return (
      m.direction === BOT_MESSAGE_DIRECTION.OUTBOUND &&
      text.includes("horario de atencion") &&
      (
        text.includes("decime cual") ||
        text.includes("sucursal queres") ||
        text.includes("lista de sucursales")
      )
    );
  });
}

function findLastSelectedBranch(messages = []) {
  const message = messages.find((m) => {
    const payload = m.payload || {};

    return (
      m.direction === BOT_MESSAGE_DIRECTION.OUTBOUND &&
      payload.selected_branch
    );
  });

  return message?.payload?.selected_branch || null;
}

function findLastBranchOptionsMessage(messages = []) {
  return messages.find((m) => {
    const payload = m.payload || {};
    const candidates = payload.branch_candidates || [];

    return (
      m.direction === BOT_MESSAGE_DIRECTION.OUTBOUND &&
      Array.isArray(candidates) &&
      candidates.length > 0
    );
  });
}

function extractBranchSearchText(text = "") {
  const clean = normalizeText(text);

  return clean
    .replace("dime", "")
    .replace("pasame", "")
    .replace("dame", "")
    .replace("el horario de", "")
    .replace("horario de", "")
    .replace("horario", "")
    .replace("la sucursal", "")
    .replace("sucursal", "")
    .replace("la", "")
    .replace("el", "")
    .trim();
}

function getStrongSingleBranchMatch(incomingText = "", branchCandidates = []) {
  // const q = normalizeText(incomingText);
  const q = extractBranchSearchText(incomingText);

  if (!q || q.length < 3) return null;

  const strongMatches = branchCandidates.filter((branch) => {
    const data = branch.toJSON ? branch.toJSON() : branch;

    const nombre = normalizeText(data.nombre_visible || "");
    const direccion = normalizeText(data.direccion || "");
    const sucursalNombre = normalizeText(data.sucursal?.nombre || "");
    const aliases = Array.isArray(data.aliases)
      ? data.aliases.map((alias) => normalizeText(alias))
      : [];

    return (
      nombre === q ||
      sucursalNombre === q ||
      aliases.includes(q) ||
      nombre.includes(q) ||
      sucursalNombre.includes(q) ||
      aliases.some((alias) => alias === q || alias.includes(q)) ||
      direccion.includes(q)
    );
  });

  if (strongMatches.length === 1) return strongMatches[0];

  return null;
}

function isOpeningStatusQuestion(text = "") {
  const clean = normalizeText(text);

  return (
    clean.includes("abren") ||
    clean.includes("abre") ||
    clean.includes("abierto") ||
    clean.includes("abiertos") ||
    clean.includes("estara abierto") ||
    clean.includes("estara abierta") ||
    clean.includes("atienden") ||
    clean.includes("trabajan")
  );
}

function isAdminContactRequest(text = "") {
  const clean = normalizeText(text);

  return (
    clean.includes("reclamo") ||
    clean.includes("queja") ||
    clean.includes("sugerencia") ||
    clean.includes("encargado") ||
    clean.includes("administracion") ||
    clean.includes("administración") ||
    clean.includes("oficina central") ||
    clean.includes("atencion al cliente") ||
    clean.includes("atención al cliente") ||
    clean.includes("hablar con") ||
    clean.includes("comunicarme con") ||
    clean.includes("comunicame con") ||
    clean.includes("quiero hablar") ||
    clean.includes("necesito hablar")
  );
}

async function getAdministrationBranch() {
  const candidates = await searchBranchMetaCandidates("oficina central", 50);

  const exact = candidates.find((branch) => {
    const data = branch.toJSON ? branch.toJSON() : branch;
    const nombre = normalizeText(data.nombre_visible || "");
    const aliases = Array.isArray(data.aliases)
      ? data.aliases.map((a) => normalizeText(a))
      : [];

    return (
      nombre.includes("oficina central") ||
      nombre.includes("administracion") ||
      aliases.includes("oficina central") ||
      aliases.includes("administracion") ||
      aliases.includes("atencion al cliente")
    );
  });

  return exact || candidates[0] || null;
}

function shouldRequestHandoff(intent, incomingText) {
  const text = String(incomingText || "").toLowerCase();
  if (isAdminContactRequest(incomingText)) return false;
  if (isScheduleQuery(text)) return false;

  if ([BOT_INTENTS.HUMAN_HANDOFF, BOT_INTENTS.COMPLAINT].includes(intent)) {
    return true;
  }

  if (intent === BOT_INTENTS.STOCK) return true;

  if (
    text.includes("reserv") ||
    text.includes("pedido") ||
    text.includes("separame")
  ) {
    return true;
  }

  return false;
}

async function createHandoffAndReply({
  conversation,
  motivo,
  incomingText,
  settings,
}) {
  await createHandoff({
    conversation_id: conversation.id,
    motivo,
    observaciones: incomingText,
  });

  return (
    settings.handoff_message ||
    "Te puedo pasar los datos de una sucursal para que lo consultes directamente con el local. Decime cuál querés contactar o te paso la lista."
  );
}

async function saveAndReturnReply({
  conversation,
  replyText,
  intent,
  modelUsed = null,
  extraPayload = {},
}) {
  await addMessage({
    conversation_id: conversation.id,
    direction: BOT_MESSAGE_DIRECTION.OUTBOUND,
    type: BOT_MESSAGE_TYPE.TEXT,
    text: replyText,
    detected_intent: intent,
    model_used: modelUsed,
    payload: extraPayload,
  });

  return {
    intent,
    replyText,
    modelUsed,
    extraPayload,
  };
}

export async function buildBotReply({
  conversation,
  incomingText,
  sucursal_id = null,
  listaprecio_id = null,
}) {
  const settings = await getBotSettings();

  const intent = detectIntent(incomingText, {
    ultima_intencion: conversation.ultima_intencion || null,
  });

  console.log("=================================");
  console.log("MENSAJE:", incomingText);
  console.log("INTENT DETECTADO:", intent);
  console.log("=================================");

  const signals = extractCommercialSignals(incomingText);

  let replyText = settings.fallback_message;
  let modelUsed = null;
  let extraPayload = { signals };

  const normalizedIncomingText = normalizeText(incomingText);
  const entities = extractBotEntities(incomingText);

  const recentMessagesForBranchContact = await BotMessage.findAll({
    where: { conversation_id: conversation.id },
    order: [["createdAt", "DESC"]],
    limit: 12,
  });

  const isContinuingScheduleFlow = lastBotAskedScheduleFlow(
    recentMessagesForBranchContact
  );

  const lastSelectedBranch = findLastSelectedBranch(
    recentMessagesForBranchContact
  );

  const lastBranchOptionsMessage = findLastBranchOptionsMessage(
    recentMessagesForBranchContact
  );

  const botAskedForBranchData = recentMessagesForBranchContact.some((m) => {
    const text = normalizeText(m.text || "");

    return (
      m.direction === BOT_MESSAGE_DIRECTION.OUTBOUND &&
      (
        text.includes("queres que te pase los datos de alguna sucursal") ||
        text.includes("te paso telefono direccion") ||
        text.includes("direccion horario y ubicacion") ||
        text.includes("decime que sucursal queres") ||
        text.includes("te paso la lista")
      )
    );
  });

  if (lastBranchOptionsMessage && /^\d+$/.test(normalizedIncomingText)) {
    const payload = lastBranchOptionsMessage.payload || {};
    const candidates = payload.branch_candidates || [];
    const selectedIndex = Number(normalizedIncomingText) - 1;
    const selectedBranch = candidates[selectedIndex];

    if (selectedBranch) {
      replyText = buildBranchContactReply(selectedBranch);

      extraPayload = {
        ...extraPayload,
        branch_contact_flow: true,
        selected_branch: selectedBranch,
      };

      return saveAndReturnReply({
        conversation,
        replyText,
        intent: BOT_INTENTS.BRANCHES,
        modelUsed: null,
        extraPayload,
      });
    }

    replyText =
      "No encontré esa opción. Respondé con uno de los números de la lista.";

    extraPayload = {
      ...extraPayload,
      branch_contact_flow: true,
      branch_candidates: candidates,
    };

    return saveAndReturnReply({
      conversation,
      replyText,
      intent: BOT_INTENTS.BRANCHES,
      modelUsed: null,
      extraPayload,
    });
  }

  const lastBotAskedBranchContact = recentMessagesForBranchContact.some((m) => {
    const text = normalizeText(m.text || "");

    return (
      m.direction === BOT_MESSAGE_DIRECTION.OUTBOUND &&
      (
        text.includes("decime que sucursal queres contactar") ||
        text.includes("decime cual queres") ||
        text.includes("decime cual sucursal queres") ||
        text.includes("te paso la lista") ||
        text.includes("lista de sucursales")
      )
    );
  });

  if (isOpeningStatusQuestion(incomingText)) {
    const events = await searchEventMetaCandidates(incomingText, {
      sucursal_id:
        conversation.sucursal_id ||
        sucursal_id ||
        settings.default_sucursal_id ||
        null,
    });

    if (events.length > 0) {
      replyText = buildEventReply(events);
    } else {
      replyText =
        "No tengo cargado un cambio especial para esa fecha. Si querés, puedo pasarte los horarios habituales de una sucursal.";
    }

    return saveAndReturnReply({
      conversation,
      replyText,
      intent: BOT_INTENTS.EVENTS,
      modelUsed: null,
      extraPayload,
    });
  }

  const isRecipeLikeQuestion =
    normalizedIncomingText.includes("receta") ||
    normalizedIncomingText.includes("cocinar") ||
    normalizedIncomingText.includes("preparar") ||
    normalizedIncomingText.includes("como hago") ||
    normalizedIncomingText.includes("como preparo") ||
    normalizedIncomingText.includes("que puedo cocinar") ||
    normalizedIncomingText.includes("que puedo hacer");

  const canContinueBranchContactFlow =
    intent === BOT_INTENTS.BRANCHES ||
    isContinuingScheduleFlow ||
    isAffirmative(incomingText) ||
    /^\d+$/.test(normalizedIncomingText) ||
    (
      intent === BOT_INTENTS.FALLBACK &&
      !signals.wantsBenefit &&
      !signals.wantsPromotion &&
      !signals.wantsEvent &&
      !isRecipeLikeQuestion
    );

  if (botAskedForBranchData && isAffirmative(incomingText)) {
    const allBranches = await getAllActiveBranchMeta();

    replyText = buildBranchOptionsReply(allBranches);

    extraPayload = {
      ...extraPayload,
      branch_contact_flow: true,
      branch_candidates: buildBranchOptionsPayload(allBranches),
    };

    return saveAndReturnReply({
      conversation,
      replyText,
      intent: BOT_INTENTS.BRANCHES,
      modelUsed: null,
      extraPayload,
    });
  }

  if (
    botAskedForBranchData &&
    ["norte", "sur", "este", "oeste", "centro"].includes(normalizedIncomingText)
  ) {
    const branchCandidates = await searchBranchMetaCandidates(
      incomingText,
      50
    );

    replyText = buildBranchOptionsReply(branchCandidates);

    extraPayload = {
      ...extraPayload,
      branch_contact_flow: true,
      branch_candidates: buildBranchOptionsPayload(branchCandidates),
    };

    return saveAndReturnReply({
      conversation,
      replyText,
      intent: BOT_INTENTS.BRANCHES,
      modelUsed: null,
      extraPayload,
    });
  }

  const asksAllBranchesSchedule =
    isScheduleQuery(incomingText) &&
    (
      normalizedIncomingText.includes("sucursales") ||
      normalizedIncomingText.includes("todas") ||
      normalizedIncomingText.includes("todos los locales") ||
      normalizedIncomingText.includes("horario de las sucursales") ||
      normalizedIncomingText.includes("horarios de las sucursales")
    );

  if (asksAllBranchesSchedule) {
    const allBranches = await getAllActiveBranchMeta();

    replyText = buildBranchOptionsReply(allBranches);

    extraPayload = {
      ...extraPayload,
      branch_contact_flow: true,
      branch_candidates: buildBranchOptionsPayload(allBranches),
    };

    return saveAndReturnReply({
      conversation,
      replyText,
      intent: BOT_INTENTS.BRANCHES,
      modelUsed: null,
      extraPayload,
    });
  }

  if (lastSelectedBranch && isScheduleQuery(incomingText)) {
    replyText = buildBranchContactReply(lastSelectedBranch);

    extraPayload = {
      ...extraPayload,
      branch_contact_flow: true,
      selected_branch: lastSelectedBranch,
    };

    return saveAndReturnReply({
      conversation,
      replyText,
      intent: BOT_INTENTS.BRANCHES,
      modelUsed: null,
      extraPayload,
    });
  }

  if (
    (lastBotAskedBranchContact || isContinuingScheduleFlow) &&
    canContinueBranchContactFlow
  ) {
    if (isAffirmative(incomingText)) {
      const allBranches = await getAllActiveBranchMeta()
      // const allBranches = await getAllActiveBranchMeta();

      replyText = buildBranchOptionsReply(allBranches);

      extraPayload = {
        ...extraPayload,
        branch_contact_flow: true,
        branch_candidates: buildBranchOptionsPayload(allBranches),
      };

      return saveAndReturnReply({
        conversation,
        replyText,
        intent: BOT_INTENTS.BRANCHES,
        modelUsed: null,
        extraPayload,
      });
    }

    const branchCandidates = await searchBranchMetaCandidates(incomingText, 50);
    const strongSingleMatch = getStrongSingleBranchMatch(
      incomingText,
      branchCandidates
    );

    if (strongSingleMatch) {
      const selectedBranch = strongSingleMatch;

      replyText = buildBranchContactReply(selectedBranch);

      extraPayload = {
        ...extraPayload,
        branch_contact_flow: true,
        selected_branch: selectedBranch.toJSON
          ? selectedBranch.toJSON()
          : selectedBranch,
      };

      return saveAndReturnReply({
        conversation,
        replyText,
        intent: BOT_INTENTS.BRANCHES,
        modelUsed: null,
        extraPayload,
      });
    }

    if (branchCandidates.length === 1) {
      const selectedBranch = branchCandidates[0];

      replyText = buildBranchContactReply(selectedBranch);

      extraPayload = {
        ...extraPayload,
        branch_contact_flow: true,
        selected_branch: selectedBranch.toJSON
          ? selectedBranch.toJSON()
          : selectedBranch,
      };

      return saveAndReturnReply({
        conversation,
        replyText,
        intent: BOT_INTENTS.BRANCHES,
        modelUsed: null,
        extraPayload,
      });
    }

    if (branchCandidates.length > 1) {
      replyText = buildBranchOptionsReply(branchCandidates);

      extraPayload = {
        ...extraPayload,
        branch_contact_flow: true,
        branch_candidates: buildBranchOptionsPayload(branchCandidates),
      };

      return saveAndReturnReply({
        conversation,
        replyText,
        intent: BOT_INTENTS.BRANCHES,
        modelUsed: null,
        extraPayload,
      });
    }

    const allBranches = await getAllActiveBranchMeta();

    replyText = buildBranchOptionsReply(allBranches);

    extraPayload = {
      ...extraPayload,
      branch_contact_flow: true,
      branch_candidates: buildBranchOptionsPayload(allBranches),
    };

    return saveAndReturnReply({
      conversation,
      replyText,
      intent: BOT_INTENTS.BRANCHES,
      modelUsed: null,
      extraPayload,
    });
  }

  if (isAdminContactRequest(incomingText)) {
    const adminBranch = await getAdministrationBranch();

    if (adminBranch) {
      replyText = [
        "Para reclamos, sugerencias o consultas con administración, te paso los datos de Atención al Cliente:",
        "",
        buildBranchContactReply(adminBranch),
      ].join("\n");

      extraPayload = {
        ...extraPayload,
        branch_contact_flow: true,
        selected_branch: adminBranch.toJSON ? adminBranch.toJSON() : adminBranch,
        admin_contact_flow: true,
      };
    } else {
      replyText = [
        "Para reclamos, sugerencias o consultas con administración, podés comunicarte con Atención al Cliente.",
        "",
        "En este momento no tengo cargados los datos de la oficina central.",
      ].join("\n");
    }

    return saveAndReturnReply({
      conversation,
      replyText,
      intent: BOT_INTENTS.BRANCHES,
      modelUsed: null,
      extraPayload,
    });
  }

  if (!settings.activo) {
    replyText =
      "En este momento el asistente automático no está activo. Te dejamos la consulta para que la revise el equipo.";

    await createHandoff({
      conversation_id: conversation.id,
      motivo: "bot_inactive",
      observaciones: incomingText,
    });
  } else if (isOrderClosingMessage(incomingText)) {
    replyText = [
      "Por ahora no tomo pedidos ni reservas desde este chat automático.",
      "",
      "Te puedo pasar teléfono, dirección, horario y ubicación de la sucursal para que lo coordines directamente con el local.",
      "",
      "Decime qué sucursal querés contactar o te paso la lista.",
    ].join("\n");
  } else if (isScheduleQuery(incomingText)) {
    if (lastSelectedBranch) {
      replyText = buildBranchContactReply(lastSelectedBranch);

      extraPayload = {
        ...extraPayload,
        branch_contact_flow: true,
        selected_branch: lastSelectedBranch,
      };
    } else {
      replyText = [
        "Puedo pasarte el horario de atención junto con los datos completos de la sucursal.",
        "",
        "Decime cuál sucursal querés o te paso la lista de sucursales disponibles.",
      ].join("\n");

      extraPayload = {
        ...extraPayload,
        schedule_flow: true,
        branch_contact_flow: true,
      };
    }
  } else if (shouldRequestHandoff(intent, incomingText)) {
    const motivo =
      intent === BOT_INTENTS.COMPLAINT
        ? "complaint"
        : intent === BOT_INTENTS.STOCK
          ? "stock_check_required"
          : "human_request";

    replyText = await createHandoffAndReply({
      conversation,
      motivo,
      incomingText,
      settings,
    });

    if (intent === BOT_INTENTS.STOCK) {
      replyText =
        "Para confirmar disponibilidad, te puedo pasar los datos de una sucursal. Decime cuál querés contactar o te paso la lista.";
    }
  } else if (intent === BOT_INTENTS.GREETING) {
    replyText = settings.welcome_message;
  } else if (intent === BOT_INTENTS.PROMOTIONS) {
    const promoDateContext = resolvePromotionDateContext(incomingText);

    const promotionResults = [];

    for (const date of promoDateContext.dates) {
      const items = await getActivePromotionProductsForBot({
        sucursal_id: sucursal_id || settings.default_sucursal_id || null,
        listaprecio_id:
          listaprecio_id || settings.default_listaprecio_id || null,
        fecha: entities.date || new Date(),
        limit: 100,
      });

      promotionResults.push(...items);
    }

    const promotionItems = mergePromotionItems(promotionResults);

    extraPayload = {
      ...extraPayload,
      promotion_date_context: {
        type: promoDateContext.type,
        label: promoDateContext.label,
        dates: promoDateContext.dates.map(formatDateOnly),
      },
      promotion_items: promotionItems,
    };

    replyText = buildPromotionProductsReply(
      promotionItems,
      promoDateContext.label
    );
  } else if (intent === BOT_INTENTS.BRANCHES) {
    const wantsAllBranches =
      normalizedIncomingText.includes("sucursales") ||
      normalizedIncomingText.includes("todas") ||
      normalizedIncomingText.includes("todos los locales") ||
      normalizedIncomingText.includes("datos de las sucursales");

    const wantsBranchesByZone =
      normalizedIncomingText.includes("zona") ||
      normalizedIncomingText.includes("norte") ||
      normalizedIncomingText.includes("sur") ||
      normalizedIncomingText.includes("este") ||
      normalizedIncomingText.includes("oeste") ||
      normalizedIncomingText.includes("centro");

    const branchCandidates = await searchBranchMetaCandidates(
      incomingText,
      50
    );

    const strongSingleMatch = getStrongSingleBranchMatch(
      incomingText,
      branchCandidates
    );

    if (strongSingleMatch && !wantsAllBranches && !wantsBranchesByZone) {
      replyText = buildBranchContactReply(strongSingleMatch);

      extraPayload = {
        ...extraPayload,
        branch_contact_flow: true,
        selected_branch: strongSingleMatch.toJSON
          ? strongSingleMatch.toJSON()
          : strongSingleMatch,
      };
    } else {
      extraPayload = {
        ...extraPayload,
        branch_contact_flow: true,
        branch_candidates: buildBranchOptionsPayload(branchCandidates),
      };

      if (branchCandidates.length === 1) {
        replyText = buildBranchContactReply(branchCandidates[0]);

        extraPayload = {
          ...extraPayload,
          selected_branch: branchCandidates[0].toJSON
            ? branchCandidates[0].toJSON()
            : branchCandidates[0],
        };
      } else if (branchCandidates.length > 1) {
        replyText = wantsAllBranches
          ? buildAllBranchesReply(branchCandidates)
          : buildBranchOptionsReply(branchCandidates);
      } else {
        const allBranches = await getAllActiveBranchMeta();

        replyText =
          allBranches.length > 0
            ? buildBranchOptionsReply(allBranches)
            : settings.branches_message ||
            "Decime qué zona o sucursal te queda cómoda y te paso dirección, teléfono, horario y ubicación de Google Maps.";

        extraPayload = {
          ...extraPayload,
          branch_contact_flow: true,
          branch_candidates: buildBranchOptionsPayload(allBranches),
        };
      }
    }
  } else if (intent === BOT_INTENTS.BENEFITS) {
    const benefitLimit = Math.min(Number(settings.max_options || 3), 5);

    const benefitCandidates = await searchBenefitMetaCandidates(
      incomingText,
      benefitLimit
    );

    extraPayload = {
      ...extraPayload,
      benefit_candidates: benefitCandidates.map((benefit) =>
        benefit.toJSON ? benefit.toJSON() : benefit
      ),
    };

    if (benefitCandidates.length > 0) {
      replyText = buildBenefitReply(benefitCandidates);
    } else {
      replyText =
        "Tenemos distintos beneficios y convenios que pueden variar por día, medio de pago o institución. Decime si consultás por jubilados, tarjeta, sindicato o algún convenio en particular.";
    }
  } else if (intent === BOT_INTENTS.EVENTS) {
    const events = await searchEventMetaCandidates(incomingText, {
      sucursal_id:
        conversation.sucursal_id ||
        sucursal_id ||
        settings.default_sucursal_id ||
        null,
    });

    if (events.length > 0) {
      replyText = buildEventReply(events);
    } else {
      replyText =
        "No tengo eventos o cambios especiales cargados en este momento. Si necesitás consultar una sucursal puntual, decime cuál y te paso sus datos de contacto.";
    }
  } else if (intent === BOT_INTENTS.PAYMENTS) {
    replyText =
      settings.payments_message ||
      "Trabajamos con efectivo, transferencia y tarjetas. Algunas promociones dependen del banco o medio de pago.";

  } else if (
    normalizedIncomingText.includes("sucursal") ||
    normalizedIncomingText.includes("sucursales") ||
    normalizedIncomingText.includes("direccion") ||
    normalizedIncomingText.includes("ubicacion") ||
    normalizedIncomingText.includes("telefono") ||
    normalizedIncomingText.includes("horario") ||
    normalizedIncomingText.includes("norte") ||
    normalizedIncomingText.includes("sur") ||
    normalizedIncomingText.includes("este") ||
    normalizedIncomingText.includes("oeste") ||
    normalizedIncomingText.includes("centro")
  ) {
    const branchCandidates = await searchBranchMetaCandidates(incomingText, 50);

    if (branchCandidates.length === 1) {
      replyText = buildBranchContactReply(branchCandidates[0]);

      extraPayload = {
        ...extraPayload,
        branch_contact_flow: true,
        selected_branch: branchCandidates[0].toJSON
          ? branchCandidates[0].toJSON()
          : branchCandidates[0],
      };
    } else if (branchCandidates.length > 1) {
      replyText = buildBranchOptionsReply(branchCandidates);

      extraPayload = {
        ...extraPayload,
        branch_contact_flow: true,
        branch_candidates: buildBranchOptionsPayload(branchCandidates),
      };
    } else {
      const allBranches = await getAllActiveBranchMeta();

      replyText = buildBranchOptionsReply(allBranches);

      extraPayload = {
        ...extraPayload,
        branch_contact_flow: true,
        branch_candidates: buildBranchOptionsPayload(allBranches),
      };
    }
  } else if (
    intent === BOT_INTENTS.PRODUCT_ADVICE ||
    intent === BOT_INTENTS.PRICE ||
    intent === BOT_INTENTS.FALLBACK
  ) {
    const candidates = await searchProductAdviceCandidates(
      incomingText,
      Number(settings.max_options || 3)
    );

    const articulos_ids = candidates.map((c) => Number(c.articulo_id));

    const pricing = await getProductPrices({
      articulos_ids,
      sucursal_id: sucursal_id || settings.default_sucursal_id || null,
      listaprecio_id:
        listaprecio_id || settings.default_listaprecio_id || null,
    });

    extraPayload = {
      ...extraPayload,
      articulos_ids,
      pricing,
    };

    if (!candidates.length) {
      replyText = buildAskBranchContactReply();
    } else if (isUnknownDetailQuestion(incomingText)) {
      replyText = buildAskBranchContactReply();
    } else if (settings.use_openai_for_advice) {
      const recentMessages = await BotMessage.findAll({
        where: { conversation_id: conversation.id },
        order: [["createdAt", "DESC"]],
        limit: 6,
      });

      const history = recentMessages.reverse().map((m) => ({
        role:
          m.direction === BOT_MESSAGE_DIRECTION.INBOUND ? "cliente" : "bot",
        text: m.text,
      }));

      const aiReply = await buildAdviceWithOpenAI({
        userMessage: incomingText,
        candidates,
        pricing,
        intent,
        conversationContext: {
          conversation_id: conversation.id,
          sucursal_id:
            conversation.sucursal_id ||
            sucursal_id ||
            settings.default_sucursal_id ||
            null,
          ultima_intencion: conversation.ultima_intencion || null,
          history,
          policy: {
            no_internal_contact_promises: true,
            unknown_answer_behavior:
              "Si no tenés el dato exacto, no digas que vas a consultar, confirmar, avisar luego, derivar, gestionar un contacto o contactar a la sucursal. Indicá que no tenés ese dato cargado y pedí al cliente qué sucursal desea contactar para pasarle teléfono, dirección, horario y ubicación.",
          },
        },
      });

      if (aiReply) {
        if (aiPromisedInternalContact(aiReply)) {
          replyText = buildAskBranchContactReply();
          modelUsed = null;
        } else {
          replyText = aiReply;
          modelUsed = settings.model_name || "gpt-5";
        }
      } else {
        replyText = buildSimpleProductReply(candidates, pricing, intent);
      }
    } else {
      replyText = buildSimpleProductReply(candidates, pricing, intent);
    }
  }

  return saveAndReturnReply({
    conversation,
    replyText,
    intent,
    modelUsed,
    extraPayload,
  });
}

export default { buildBotReply };
