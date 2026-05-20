export const BOT_INTENTS = {
  GREETING: "greeting",
  PRODUCT_ADVICE: "product_advice",
  PROMOTIONS: "promotions",
  BRANCHES: "branches",
  PAYMENTS: "payments",
  PRICE: "price",
  STOCK: "stock",
  COMPLAINT: "complaint",
  HUMAN_HANDOFF: "human_handoff",
  FALLBACK: "fallback",
  BENEFITS: "benefits",
  EVENTS: "events",
};

export const BOT_CHANNELS = {
  WHATSAPP: "whatsapp",
};

export const BOT_CONVERSATION_STATUS = {
  OPEN: "open",
  HANDOFF_REQUESTED: "handoff_requested",
  IN_HANDOFF: "in_handoff",
  CLOSED: "closed",
};

export const BOT_MESSAGE_DIRECTION = {
  INBOUND: "inbound",
  OUTBOUND: "outbound",
};

export const BOT_MESSAGE_TYPE = {
  TEXT: "text",
  SYSTEM: "system",
  HANDOFF: "handoff",
  ERROR: "error",
};

export const BOT_HANDOFF_STATUS = {
  PENDING: "pending",
  TAKEN: "taken",
  CLOSED: "closed",
};

export const BOT_PROVIDER = {
  META: "meta",
  TWILIO: "twilio",
  MANUAL: "manual",
};

export const BOT_DEFAULTS = {
  GREETING:
    "Hola, soy el asistente de La Tradición. Te ayudo a elegir lo que mejor te convenga. ¿Qué estás buscando hoy?",
  FALLBACK:
    "No llegué a entender bien tu consulta. Si querés, te ayudo con cortes, precios, promociones, sucursales o medios de pago.",
  HANDOFF:
    "Te paso con una persona del equipo para ayudarte mejor.",
  PAYMENTS:
    "Podés consultar por efectivo, transferencias y tarjetas. Si querés, te cuento también las promociones vigentes.",
  BRANCHES:
    "Decime qué sucursal o zona te queda más cómoda y te indico horarios y ubicación.",
  PROMOTIONS:
    "Estas son las promociones y beneficios vigentes para hoy.",
};