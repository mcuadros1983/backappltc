import { broadcastToClients } from "../../websocket.js";

function normalizeText(value) {
  return String(value || "").trim();
}

export const requestAudioSync = async (req, res) => {
  try {
    const sucursalCodigo = normalizeText(req.body?.sucursalCodigo);
    const fecha = normalizeText(req.body?.fecha);

    if (!sucursalCodigo) {
      return res.status(400).json({
        ok: false,
        error: "El campo 'sucursalCodigo' es obligatorio",
      });
    }

    if (!fecha) {
      return res.status(400).json({
        ok: false,
        error: "El campo 'fecha' es obligatorio",
      });
    }

    const requestId = `audio-${sucursalCodigo}-${Date.now()}`;

    const payload = {
      type: "process_audio_date",
      requestId,
      sucursalCodigo,
      fecha,
    };

    console.log("payload", payload)

    broadcastToClients(payload);

    return res.status(200).json({
      ok: true,
      message: "Solicitud de sincronización de audios enviada correctamente",
      data: {
        requestId,
        sucursalCodigo,
        fecha,
      },
    });
  } catch (error) {
    console.error("Error requestAudioSync:", error);
    return res.status(500).json({
      ok: false,
      error: "No se pudo enviar la solicitud de sincronización de audios",
    });
  }
};