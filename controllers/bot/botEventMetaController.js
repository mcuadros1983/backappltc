import {
  listBotEventMeta,
  getBotEventMetaById,
  createBotEventMeta,
  updateBotEventMeta,
  deleteBotEventMeta,
} from "../../services/bot/botEventService.js";

export async function list(req, res) {
  try {
    const rows = await listBotEventMeta(req.query);

    return res.json({
      ok: true,
      count: rows.length,
      data: rows,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: "Error al listar eventos del bot",
      details: error.message,
    });
  }
}

export async function getById(req, res) {
  try {
    const row = await getBotEventMetaById(req.params.id);

    if (!row) {
      return res.status(404).json({
        ok: false,
        error: "Evento no encontrado",
      });
    }

    return res.json({
      ok: true,
      data: row,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: "Error al obtener evento del bot",
      details: error.message,
    });
  }
}
export async function create(req, res) {
  try {
    const row = await createBotEventMeta(req.body);

    return res.status(201).json({
      ok: true,
      data: row,
    });
  } catch (error) {
    console.error("[BOT EVENT META CREATE ERROR]", {
      message: error.message,
      name: error.name,
      errors: error.errors?.map((e) => ({
        message: e.message,
        path: e.path,
        value: e.value,
        validatorKey: e.validatorKey,
      })),
      body: req.body,
    });

    return res.status(400).json({
      ok: false,
      error: "Error al crear evento del bot",
      details: error.message,
      validationErrors: error.errors?.map((e) => ({
        field: e.path,
        message: e.message,
        value: e.value,
      })),
    });
  }
}

export async function update(req, res) {
  try {
    const row = await updateBotEventMeta(req.params.id, req.body);

    if (!row) {
      return res.status(404).json({
        ok: false,
        error: "Evento no encontrado",
      });
    }

    return res.json({
      ok: true,
      data: row,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: "Error al actualizar evento del bot",
      details: error.message,
    });
  }
}

export async function remove(req, res) {
  try {
    const deleted = await deleteBotEventMeta(req.params.id);

    if (!deleted) {
      return res.status(404).json({
        ok: false,
        error: "Evento no encontrado",
      });
    }

    return res.json({
      ok: true,
      message: "Evento eliminado correctamente",
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: "Error al eliminar evento del bot",
      details: error.message,
    });
  }
}

export default {
  list,
  getById,
  create,
  update,
  remove,
};