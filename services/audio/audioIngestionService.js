import { AudioSegment } from "../../models/audio/AudioSegment.js";
import { analyzeSegmentIfNeeded } from "./audioAnalysisService.js";

function parseDateSafe(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function ingestAudioSegment(payload) {
  const segmentId = String(payload.segmentId || "").trim();
  const sucursalCodigo = String(payload.sucursalCodigo || "").trim();
  const fecha = String(payload.fecha || "").trim();
  const transcriptionText = String(payload.transcriptionText || "").trim();

  if (!segmentId) {
    throw new Error("segmentId es obligatorio");
  }

  if (!sucursalCodigo) {
    throw new Error("sucursalCodigo es obligatorio");
  }

  if (!fecha) {
    throw new Error("fecha es obligatoria");
  }

  const existing = await AudioSegment.findOne({
    where: { segment_id: segmentId },
  });

  if (existing) {
    return {
      duplicate: true,
      segment: existing,
    };
  }

  const segment = await AudioSegment.create({
    segment_id: segmentId,
    sucursal_codigo: sucursalCodigo,
    fecha,
    file_name: payload.fileName || null,
    created_at_local: parseDateSafe(payload.createdAt),
    duration_ms: payload.durationMs || null,
    sample_rate: payload.sampleRate || null,
    reason: payload.reason || null,

    transcription_status: payload.transcriptionStatus || "not_available",
    transcription_text: transcriptionText || null,
    transcription_engine: payload.transcriptionEngine || null,
    transcription_model: payload.transcriptionModel || null,
    transcription_updated_at: parseDateSafe(payload.transcriptionUpdatedAt),

    has_text: !!payload.hasText,
    has_recommendation: !!payload.hasRecommendation,
    has_offer: !!payload.hasOffer,
    has_suggested_sale: !!payload.hasSuggestedSale,
    has_question: !!payload.hasQuestion,
    classification_confidence: payload.classificationConfidence || null,

    classification_json: payload.classification || null,
    metadata_json: payload.metadata || null,

    analysis_status: "pending",
  });

  try {
    await analyzeSegmentIfNeeded(segment);
  } catch (error) {
    console.error("Error analizando segmento con IA:", error.message);
    segment.analysis_status = "pending";
    await segment.save();
  }

  return {
    duplicate: false,
    segment,
  };
}