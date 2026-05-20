import { listConversations, getConversationById } from "../../services/bot/botConversationService.js";

export async function list(req, res) {
  try {
    const rows = await listConversations(req.query);
    return res.json({
      ok: true,
      count: rows.length,
      data: rows,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: "Error al listar conversaciones",
      details: error.message,
    });
  }
}

export async function getById(req, res) {
  try {
    const row = await getConversationById(req.params.id);

    if (!row) {
      return res.status(404).json({
        ok: false,
        error: "Conversación no encontrada",
      });
    }

    return res.json({
      ok: true,
      data: row,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: "Error al obtener conversación",
      details: error.message,
    });
  }
}

export default {
  list,
  getById,
};