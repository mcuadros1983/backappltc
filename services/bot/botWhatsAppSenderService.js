import { getBotSettings, resolveWhatsAppConfig } from "./botConfigService.js";

// function normalizeMetaRecipient(phone) {
//   if (!phone) return null;
//   return String(phone).replace(/\D/g, "");
// }

function normalizeMetaRecipient(phone) {
  if (!phone) return null;

  let cleaned = String(phone).replace(/\D/g, "");

  // Workaround para números móviles de Argentina en Meta test mode:
  // WhatsApp entrega 549..., pero el envío con test number puede requerir 54...
  if (cleaned.startsWith("549") && cleaned.length >= 13) {
    cleaned = `54${cleaned.slice(3)}`;
  }

  return cleaned;
}

export async function sendMetaTextMessage({ to, text, preview_url = false }) {
  const settings = await getBotSettings();
  const config = resolveWhatsAppConfig(settings);

  if (config.provider !== "meta") {
    throw new Error("El provider configurado no es Meta");
  }

  if (!config.access_token) {
    throw new Error("Falta access_token de WhatsApp Cloud API");
  }

  if (!config.phone_number_id) {
    throw new Error("Falta phone_number_id de WhatsApp Cloud API");
  }

  const recipient = normalizeMetaRecipient(to);

  console.log("[BOT META] Recipient normalizado:", recipient);

  if (!recipient) {
    throw new Error("Número de destino inválido");
  }

  const url = `https://graph.facebook.com/${config.graph_api_version}/${config.phone_number_id}/messages`;

  const payload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: recipient,
    type: "text",
    text: {
      preview_url,
      body: text,
    },
  };

  console.log("[BOT META] Enviando mensaje...");
  console.log("[BOT META] URL:", url);
  console.log("[BOT META] Recipient:", recipient);
  console.log("[BOT META] Payload:", JSON.stringify(payload, null, 2));

  console.log("========== BOT META SEND DEBUG ==========");
console.log("[BOT META] provider:", process.env.WHATSAPP_PROVIDER);
console.log("[BOT META] graph version:", process.env.WHATSAPP_GRAPH_API_VERSION);
console.log("[BOT META] phone_number_id:", process.env.WHATSAPP_PHONE_NUMBER_ID);

console.log(
  "[BOT META] token preview:",
  process.env.WHATSAPP_ACCESS_TOKEN
    ? `${process.env.WHATSAPP_ACCESS_TOKEN.slice(0, 12)}...${process.env.WHATSAPP_ACCESS_TOKEN.slice(-8)}`
    : "NO DEFINIDO"
);

console.log("[BOT META] token length:", process.env.WHATSAPP_ACCESS_TOKEN?.length || 0);
console.log("[BOT META] url:", url);
console.log("[BOT META] to:", to);
console.log("=========================================");

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  console.log("[BOT META] Status:", response.status);
  console.log("[BOT META] Response:", JSON.stringify(data, null, 2));

  if (!response.ok) {
    throw new Error(
      `Error enviando mensaje a Meta: ${response.status} - ${JSON.stringify(data)}`
    );
  }

  return data;
}

export async function markMetaMessageAsRead(messageId) {
  const settings = await getBotSettings();
  const config = resolveWhatsAppConfig(settings);

  if (!config.access_token || !config.phone_number_id) {
    throw new Error("Falta configuración de Meta para marcar como leído");
  }

  const url = `https://graph.facebook.com/${config.graph_api_version}/${config.phone_number_id}/messages`;

  const payload = {
    messaging_product: "whatsapp",
    status: "read",
    message_id: messageId,
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  console.log("[BOT META] Mark as read status:", response.status);
  console.log("[BOT META] Mark as read response:", JSON.stringify(data, null, 2));

  if (!response.ok) {
    throw new Error(
      `Error marcando mensaje como leído: ${response.status} - ${JSON.stringify(data)}`
    );
  }

  return data;
}

export default {
  sendMetaTextMessage,
  markMetaMessageAsRead,
};