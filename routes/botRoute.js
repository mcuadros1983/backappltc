import { Router } from "express";
import botWebhookController from "../controllers/bot/botWebhookController.js";
import botSettingsController from "../controllers/bot/botSettingsController.js";
import botProductMetaController from "../controllers/bot/botProductMetaController.js";
import botBranchMetaController from "../controllers/bot/botBranchMetaController.js";
import botConversationController from "../controllers/bot/botConversationController.js";
import botHandoffController from "../controllers/bot/botHandoffController.js";
import botBenefitMetaController from "../controllers/bot/botBenefitMetaController.js";
import botEventMetaController from "../controllers/bot/botEventMetaController.js";

export const publicBotRouter = Router();
export const privateBotRouter = Router();

/**
 * Públicas - webhook WhatsApp
 */
publicBotRouter.get("/bot/webhook", botWebhookController.verifyWebhook);
publicBotRouter.post("/bot/webhook", botWebhookController.receiveWebhook);

/**
 * Privadas - administración ERP
 */
privateBotRouter.get("/bot/settings", botSettingsController.getSettings);
privateBotRouter.put("/bot/settings", botSettingsController.putSettings);

privateBotRouter.get("/bot/product-meta", botProductMetaController.list);
privateBotRouter.get("/bot/product-meta/:id", botProductMetaController.getById);
privateBotRouter.post("/bot/product-meta", botProductMetaController.create);
privateBotRouter.put("/bot/product-meta/:id", botProductMetaController.update);
privateBotRouter.delete("/bot/product-meta/:id", botProductMetaController.remove);

privateBotRouter.get("/bot/branch-meta", botBranchMetaController.list);
privateBotRouter.get("/bot/branch-meta/:id", botBranchMetaController.getById);
privateBotRouter.post("/bot/branch-meta", botBranchMetaController.create);
privateBotRouter.put("/bot/branch-meta/:id", botBranchMetaController.update);
privateBotRouter.delete("/bot/branch-meta/:id", botBranchMetaController.remove);

privateBotRouter.get("/bot/benefit-meta", botBenefitMetaController.list);
privateBotRouter.get("/bot/benefit-meta/:id", botBenefitMetaController.getById);
privateBotRouter.post("/bot/benefit-meta", botBenefitMetaController.create);
privateBotRouter.put("/bot/benefit-meta/:id", botBenefitMetaController.update);
privateBotRouter.delete("/bot/benefit-meta/:id", botBenefitMetaController.remove);

privateBotRouter.get("/bot/event-meta", botEventMetaController.list);
privateBotRouter.get("/bot/event-meta/:id", botEventMetaController.getById);
privateBotRouter.post("/bot/event-meta", botEventMetaController.create);
privateBotRouter.put("/bot/event-meta/:id", botEventMetaController.update);
privateBotRouter.delete("/bot/event-meta/:id", botEventMetaController.remove);

privateBotRouter.get("/bot/conversations", botConversationController.list);
privateBotRouter.get("/bot/conversations/:id", botConversationController.getById);

privateBotRouter.get("/bot/handoffs", botHandoffController.list);
privateBotRouter.put("/bot/handoffs/:id/take", botHandoffController.take);
privateBotRouter.put("/bot/handoffs/:id/close", botHandoffController.close);

// export default {
//   publicBotRouter,
//   privateBotRouter,
// };