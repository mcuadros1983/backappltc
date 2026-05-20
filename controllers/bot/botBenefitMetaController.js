import {
  listBotBenefitMeta,
  getBotBenefitMetaById,
  createBotBenefitMeta,
  updateBotBenefitMeta,
  deleteBotBenefitMeta,
} from "../../services/bot/botBenefitService.js";

export async function list(req, res) {
  try {
    const rows = await listBotBenefitMeta(req.query);

    return res.json({
      ok: true,
      count: rows.length,
      data: rows,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: "Error al listar beneficios del bot",
      details: error.message,
    });
  }
}

export async function getById(req, res) {
  try {
    const row = await getBotBenefitMetaById(req.params.id);

    if (!row) {
      return res.status(404).json({
        ok: false,
        error: "Beneficio no encontrado",
      });
    }

    return res.json({
      ok: true,
      data: row,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: "Error al obtener beneficio del bot",
      details: error.message,
    });
  }
}

export async function create(req, res) {
  try {
    const row = await createBotBenefitMeta(req.body);

    return res.status(201).json({
      ok: true,
      data: row,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: "Error al crear beneficio del bot",
      details: error.message,
    });
  }
}

export async function update(req, res) {
  try {
    const row = await updateBotBenefitMeta(req.params.id, req.body);

    if (!row) {
      return res.status(404).json({
        ok: false,
        error: "Beneficio no encontrado",
      });
    }

    return res.json({
      ok: true,
      data: row,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: "Error al actualizar beneficio del bot",
      details: error.message,
    });
  }
}

export async function remove(req, res) {
  try {
    const deleted = await deleteBotBenefitMeta(req.params.id);

    if (!deleted) {
      return res.status(404).json({
        ok: false,
        error: "Beneficio no encontrado",
      });
    }

    return res.json({
      ok: true,
      message: "Beneficio eliminado correctamente",
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: "Error al eliminar beneficio del bot",
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