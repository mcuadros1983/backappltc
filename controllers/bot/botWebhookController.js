import { getBotSettings, resolveWhatsAppConfig } from "../../services/bot/botConfigService.js";
import { processIncomingWhatsappMessage } from "../../services/bot/botWhatsappWebhookService.js";

export async function verifyWebhook(req, res) {
  try {
    const settings = await getBotSettings();
    const config = resolveWhatsAppConfig(settings);

    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode === "subscribe" && token && token === config.verify_token) {
      return res.status(200).send(challenge);
    }

    return res.status(403).json({
      ok: false,
      error: "Token de verificación inválido",
    });
  } catch (error) {
    console.error("[BOT WEBHOOK] Error verificando webhook:", error);
    return res.status(500).json({
      ok: false,
      error: "Error verificando webhook",
      details: error.message,
    });
  }
}

export async function receiveWebhook(req, res) {
  try {
    const result = await processIncomingWhatsappMessage(req.body);

    console.log("[BOT WEBHOOK] Resultado processIncomingWhatsappMessage:");
    console.dir(result, { depth: null });

    return res.status(200).json(result);
  } catch (error) {
    console.error("[BOT WEBHOOK] Error procesando webhook:", error);
    return res.status(500).json({
      ok: false,
      error: "Error procesando webhook",
      details: error.message,
    });
  }
}

export default {
  verifyWebhook,
  receiveWebhook,
};