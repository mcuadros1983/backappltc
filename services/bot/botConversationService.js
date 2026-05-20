import { Op } from "sequelize";
import BotConversation from "../../models/bot/botConversationModel.js";
import BotMessage from "../../models/bot/botMessageModel.js";

export async function findOrCreateConversation({
  telefono_cliente,
  nombre_cliente = null,
  canal = "whatsapp",
  sucursal_id = null,
  metadata = {},
}) {
  let conversation = await BotConversation.findOne({
    where: {
      telefono_cliente,
      canal,
      estado: {
        [Op.in]: ["open", "handoff_requested", "in_handoff"],
      },
    },
    order: [["updatedAt", "DESC"]],
  });

  if (!conversation) {
    conversation = await BotConversation.create({
      telefono_cliente,
      nombre_cliente,
      canal,
      sucursal_id,
      metadata,
      last_message_at: new Date(),
    });
  } else {
    await conversation.update({
      nombre_cliente: nombre_cliente || conversation.nombre_cliente,
      sucursal_id: sucursal_id || conversation.sucursal_id,
      metadata: { ...(conversation.metadata || {}), ...metadata },
      last_message_at: new Date(),
    });
  }

  return conversation;
}

export async function addMessage({
  conversation_id,
  direction,
  type = "text",
  text = "",
  detected_intent = null,
  model_used = null,
  provider_message_id = null,
  payload = {},
}) {
  const message = await BotMessage.create({
    conversation_id,
    direction,
    type,
    text,
    detected_intent,
    model_used,
    provider_message_id,
    payload,
  });

  await BotConversation.update(
    {
      ultima_intencion: detected_intent,
      last_message_at: new Date(),
    },
    {
      where: { id: conversation_id },
    }
  );

  return message;
}

export async function setConversationStatus(conversationId, estado, extra = {}) {
  await BotConversation.update(
    {
      estado,
      ...extra,
    },
    { where: { id: conversationId } }
  );

  return BotConversation.findByPk(conversationId);
}

export async function listConversations(filters = {}) {
  const where = {};

  if (filters.estado) where.estado = filters.estado;
  if (filters.telefono_cliente) where.telefono_cliente = filters.telefono_cliente;
  if (filters.canal) where.canal = filters.canal;

  const conversations = await BotConversation.findAll({
    where,
    order: [["updatedAt", "DESC"]],
    limit: 50, // importante para no romper performance
  });

  const conversationIds = conversations.map((c) => c.id);

  if (!conversationIds.length) return [];

  // 🔥 Traemos último mensaje por conversación
  const lastMessages = await BotMessage.findAll({
    where: {
      conversation_id: {
        [Op.in]: conversationIds,
      },
    },
    order: [["createdAt", "DESC"]],
  });

  // Map para quedarnos con el último mensaje por conversación
  const lastMessageMap = new Map();

  for (const msg of lastMessages) {
    if (!lastMessageMap.has(msg.conversation_id)) {
      lastMessageMap.set(msg.conversation_id, msg);
    }
  }

  // 🔥 Armar respuesta enriquecida
  return conversations.map((conv) => {
    const lastMsg = lastMessageMap.get(conv.id);

    return {
      ...conv.toJSON(),

      // 🔥 lo que necesita el frontend
      ultimo_mensaje: lastMsg?.text || null,
      last_message_at: lastMsg?.createdAt || conv.last_message_at,
      last_message_direction: lastMsg?.direction || null,
    };
  });
}

export async function getConversationById(id) {
  return BotConversation.findByPk(id, {
    include: [
      {
        model: BotMessage,
        as: "messages",
      },
    ],
    order: [[{ model: BotMessage, as: "messages" }, "createdAt", "ASC"]],
  });
}

export default {
  findOrCreateConversation,
  addMessage,
  setConversationStatus,
  listConversations,
  getConversationById,
};