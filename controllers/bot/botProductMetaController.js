import {
  listBotProductMeta,
  getBotProductMetaById,
  createBotProductMeta,
  updateBotProductMeta,
  deleteBotProductMeta,
} from "../../services/bot/botProductService.js";

export async function list(req, res) {
  try {
    const rows = await listBotProductMeta(req.query);
    return res.json({
      ok: true,
      count: rows.length,
      data: rows,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: "Error al listar metadata del bot",
      details: error.message,
    });
  }
}

export async function getById(req, res) {
  try {
    const row = await getBotProductMetaById(req.params.id);

    if (!row) {
      return res.status(404).json({
        ok: false,
        error: "Registro no encontrado",
      });
    }

    return res.json({
      ok: true,
      data: row,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: "Error al obtener metadata del bot",
      details: error.message,
    });
  }
}

export async function create(req, res) {
  try {
    const row = await createBotProductMeta(req.body);
    return res.status(201).json({
      ok: true,
      data: row,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: "Error al crear metadata del bot",
      details: error.message,
    });
  }
}

export async function update(req, res) {
  try {
    const row = await updateBotProductMeta(req.params.id, req.body);

    if (!row) {
      return res.status(404).json({
        ok: false,
        error: "Registro no encontrado",
      });
    }

    return res.json({
      ok: true,
      data: row,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: "Error al actualizar metadata del bot",
      details: error.message,
    });
  }
}

export async function remove(req, res) {
  try {
    const deleted = await deleteBotProductMeta(req.params.id);

    if (!deleted) {
      return res.status(404).json({
        ok: false,
        error: "Registro no encontrado",
      });
    }

    return res.json({
      ok: true,
      message: "Registro eliminado correctamente",
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: "Error al eliminar metadata del bot",
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