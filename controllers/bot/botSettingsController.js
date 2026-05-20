import { getBotSettings, updateBotSettings } from "../../services/bot/botConfigService.js";

export async function getSettings(req, res) {
  try {
    const settings = await getBotSettings();
    return res.json({
      ok: true,
      data: settings,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: "Error al obtener configuración del bot",
      details: error.message,
    });
  }
}

export async function putSettings(req, res) {
  try {
    const settings = await updateBotSettings(req.body);
    return res.json({
      ok: true,
      data: settings,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: "Error al actualizar configuración del bot",
      details: error.message,
    });
  }
}

export default {
  getSettings,
  putSettings,
};