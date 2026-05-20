import { listHandoffs, takeHandoff, closeHandoff } from "../../services/bot/botHandoffService.js";

export async function list(req, res) {
  try {
    const rows = await listHandoffs(req.query);
    return res.json({
      ok: true,
      count: rows.length,
      data: rows,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: "Error al listar derivaciones",
      details: error.message,
    });
  }
}

export async function take(req, res) {
  try {
    const row = await takeHandoff(req.params.id, req.user?.id || null);

    if (!row) {
      return res.status(404).json({
        ok: false,
        error: "Derivación no encontrada",
      });
    }

    return res.json({
      ok: true,
      data: row,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: "Error al tomar derivación",
      details: error.message,
    });
  }
}

export async function close(req, res) {
  try {
    const row = await closeHandoff(req.params.id);

    if (!row) {
      return res.status(404).json({
        ok: false,
        error: "Derivación no encontrada",
      });
    }

    return res.json({
      ok: true,
      data: row,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: "Error al cerrar derivación",
      details: error.message,
    });
  }
}

export default {
  list,
  take,
  close,
};