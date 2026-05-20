import normalizePhone from "../../utils/bot/normalizePhone.js";
import {
  BOT_CHANNELS,
  BOT_MESSAGE_DIRECTION,
  BOT_MESSAGE_TYPE,
} from "../../utils/bot/botConstants.js";
import { findOrCreateConversation, addMessage } from "./botConversationService.js";
import { buildBotReply } from "./botReplyService.js";
import {
  sendMetaTextMessage,
  markMetaMessageAsRead,
} from "./botWhatsAppSenderService.js";
import BotMessage from "../../models/bot/botMessageModel.js";

function extractMessageFromBody(body = {}) {
  const value = body?.entry?.[0]?.changes?.[0]?.value;
  const message = value?.messages?.[0];
  const contact = value?.contacts?.[0];

  if (message?.text?.body) {
    return {
      provider: "meta",
      phone: message.from,
      name: contact?.profile?.name || null,
      text: message.text.body,
      message_id: message.id || null,
      raw: body,
    };
  }

  if (body?.message?.text) {
    return {
      provider: body.provider || "manual",
      phone: body.message.from,
      name: body.message.name || null,
      text: body.message.text,
      message_id: body.message.id || null,
      raw: body,
    };
  }

  return null;
}

export async function processIncomingWhatsappMessage(body = {}) {
  const parsed = extractMessageFromBody(body);

  if (!parsed || !parsed.text) {
    return {
      ok: false,
      ignored: true,
      reason: "No se encontró un mensaje de texto válido",
    };
  }

  // ✅ PRO: evitar mensajes duplicados de Meta por provider_message_id
  if (parsed.message_id) {
    const existingInbound = await BotMessage.findOne({
      where: {
        provider_message_id: parsed.message_id,
      },
    });

    if (existingInbound) {
      console.log(
        "[BOT WHATSAPP] Mensaje duplicado ignorado:",
        parsed.message_id
      );

      return {
        ok: false,
        ignored: true,
        reason: "Mensaje ya procesado",
        provider_message_id: parsed.message_id,
      };
    }
  }

  const telefono_cliente = normalizePhone(parsed.phone);

  console.log("[BOT WHATSAPP] Mensaje entrante:");
  console.dir(parsed, { depth: null });

  const conversation = await findOrCreateConversation({
    telefono_cliente,
    nombre_cliente: parsed.name,
    canal: BOT_CHANNELS.WHATSAPP,
    metadata: {
      provider: parsed.provider,
      raw_phone: parsed.phone,
    },
  });

  await addMessage({
    conversation_id: conversation.id,
    direction: BOT_MESSAGE_DIRECTION.INBOUND,
    type: BOT_MESSAGE_TYPE.TEXT,
    text: parsed.text,
    provider_message_id: parsed.message_id,
    payload: {
      provider: parsed.provider,
      message_id: parsed.message_id,
      raw: parsed.raw,
    },
  });

  try {
    if (parsed.provider === "meta" && parsed.message_id) {
      await markMetaMessageAsRead(parsed.message_id);
    }
  } catch (error) {
    console.error("[BOT META] Error marcando mensaje como leído:", error.message);
  }

  const botResponse = await buildBotReply({
    conversation,
    incomingText: parsed.text,
  });

  console.log("[BOT WHATSAPP] Respuesta generada por el bot:");
  console.dir(botResponse, { depth: null });

  let providerResponse = null;
  let sendError = null;

  try {
    if (parsed.provider === "meta") {
      providerResponse = await sendMetaTextMessage({
        to: telefono_cliente,
        text: botResponse.replyText,
      });
    }
  } catch (error) {
    sendError = error.message;

    console.error("[BOT WHATSAPP] Error enviando respuesta a Meta:", error.message);

    await addMessage({
      conversation_id: conversation.id,
      direction: BOT_MESSAGE_DIRECTION.OUTBOUND,
      type: BOT_MESSAGE_TYPE.ERROR,
      text: "Error enviando respuesta al proveedor WhatsApp",
      detected_intent: botResponse.intent,
      payload: {
        error: error.message,
      },
    });
  }

  return {
    ok: true,
    conversation_id: conversation.id,
    intent: botResponse.intent,
    replyText: botResponse.replyText,
    providerResponse,
    sendError,
  };
}

export default {
  processIncomingWhatsappMessage,
};