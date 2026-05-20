import BotSetting from "../../models/bot/botSettingModel.js";
import { BOT_DEFAULTS } from "../../utils/bot/botConstants.js";

export async function getBotSettings() {
  let settings = await BotSetting.findOne({
    order: [["id", "ASC"]],
  });

  if (!settings) {
    settings = await BotSetting.create({
      provider: process.env.WHATSAPP_PROVIDER || "meta",
      verify_token: process.env.WHATSAPP_VERIFY_TOKEN || null,
      access_token: process.env.WHATSAPP_ACCESS_TOKEN || null,
      phone_number_id: process.env.WHATSAPP_PHONE_NUMBER_ID || null,
      graph_api_version: process.env.WHATSAPP_GRAPH_API_VERSION || "v23.0",
      welcome_message: BOT_DEFAULTS.GREETING,
      fallback_message: BOT_DEFAULTS.FALLBACK,
      handoff_message: BOT_DEFAULTS.HANDOFF,
      payments_message: BOT_DEFAULTS.PAYMENTS,
      promotions_message: BOT_DEFAULTS.PROMOTIONS,
      branches_message: BOT_DEFAULTS.BRANCHES,
    });
  }

  return settings;
}

export async function updateBotSettings(data = {}) {
  const settings = await getBotSettings();
  await settings.update(data);
  return settings;
}

export function resolveWhatsAppConfig(settings) {
  return {
    provider: process.env.WHATSAPP_PROVIDER || "meta",
    verify_token: process.env.WHATSAPP_VERIFY_TOKEN || null,
    access_token: process.env.WHATSAPP_ACCESS_TOKEN || null,
    phone_number_id:
     process.env.WHATSAPP_PHONE_NUMBER_ID || null,
    graph_api_version:
      process.env.WHATSAPP_GRAPH_API_VERSION ||
      "v23.0",
  };
}

export default {
  getBotSettings,
  updateBotSettings,
  resolveWhatsAppConfig,
};