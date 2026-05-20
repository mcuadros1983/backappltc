import BotHandoffRequest from "../../models/bot/botHandoffRequestModel.js";
import { BOT_HANDOFF_STATUS } from "../../utils/bot/botConstants.js";
import { setConversationStatus } from "./botConversationService.js";

export async function createHandoff({
  conversation_id,
  motivo,
  observaciones = null,
}) {
  const existing = await BotHandoffRequest.findOne({
    where: {
      conversation_id,
      estado: BOT_HANDOFF_STATUS.PENDING,
    },
    order: [["createdAt", "DESC"]],
  });

  if (existing) return existing;

  const handoff = await BotHandoffRequest.create({
    conversation_id,
    motivo,
    observaciones,
    estado: BOT_HANDOFF_STATUS.PENDING,
  });

  await setConversationStatus(conversation_id, "handoff_requested", {
    derivada: true,
  });

  return handoff;
}

export async function takeHandoff(id, assigned_user_id) {
  const handoff = await BotHandoffRequest.findByPk(id);
  if (!handoff) return null;

  await handoff.update({
    estado: BOT_HANDOFF_STATUS.TAKEN,
    assigned_user_id,
    taken_at: new Date(),
  });

  await setConversationStatus(handoff.conversation_id, "in_handoff", {
    derivada: true,
  });

  return handoff;
}

export async function closeHandoff(id) {
  const handoff = await BotHandoffRequest.findByPk(id);
  if (!handoff) return null;

  await handoff.update({
    estado: BOT_HANDOFF_STATUS.CLOSED,
    closed_at: new Date(),
  });

  await setConversationStatus(handoff.conversation_id, "closed", {
    derivada: true,
  });

  return handoff;
}

export async function listHandoffs(filters = {}) {
  const where = {};
  if (filters.estado) where.estado = filters.estado;
  return BotHandoffRequest.findAll({
    where,
    order: [["createdAt", "DESC"]],
  });
}

export default {
  createHandoff,
  takeHandoff,
  closeHandoff,
  listHandoffs,
};