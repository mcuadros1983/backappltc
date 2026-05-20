import { Op } from "sequelize";
import { AudioSegment } from "../../models/audio/AudioSegment.js";
import { AudioSegmentAnalysis } from "../../models/audio/AudioSegmentAnalysis.js";

function parseBooleanQuery(value) {
  if (value === undefined || value === null || value === "") return undefined;
  if (value === true || value === "true") return true;
  if (value === false || value === "false") return false;
  return undefined;
}

function buildWhereFromQuery(query) {
  const where = {};

  if (query.sucursalCodigo) {
    where.sucursal_codigo = query.sucursalCodigo;
  }

  if (query.fecha) {
    where.fecha = query.fecha;
  }

  if (query.analysisStatus) {
    where.analysis_status = query.analysisStatus;
  }

  const hasQuestion = parseBooleanQuery(query.hasQuestion);
  if (hasQuestion !== undefined) {
    where.has_question = hasQuestion;
  }

  const hasRecommendation = parseBooleanQuery(query.hasRecommendation);
  if (hasRecommendation !== undefined) {
    where.has_recommendation = hasRecommendation;
  }

  const hasSuggestedSale = parseBooleanQuery(query.hasSuggestedSale);
  if (hasSuggestedSale !== undefined) {
    where.has_suggested_sale = hasSuggestedSale;
  }

  if (query.from || query.to) {
    where.createdAt = {};
    if (query.from) where.createdAt[Op.gte] = new Date(query.from);
    if (query.to) where.createdAt[Op.lte] = new Date(query.to);
  }

  if (query.search) {
    const search = String(query.search).trim();
    if (search) {
      where[Op.or] = [
        { transcription_text: { [Op.iLike]: `%${search}%` } },
        { file_name: { [Op.iLike]: `%${search}%` } },
        { segment_id: { [Op.iLike]: `%${search}%` } },
      ];
    }
  }

  return where;
}

function mapSegmentRow(row) {
  const analysis = row.analysis || null;

  return {
    id: row.id,
    segmentId: row.segment_id,
    sucursalCodigo: row.sucursal_codigo,
    fecha: row.fecha,
    fileName: row.file_name,
    createdAtLocal: row.created_at_local,
    durationMs: row.duration_ms,
    reason: row.reason,
    transcriptionStatus: row.transcription_status,
    transcriptionText: row.transcription_text,
    hasText: row.has_text,
    hasQuestion: row.has_question,
    hasRecommendation: row.has_recommendation,
    hasOffer: row.has_offer,
    hasSuggestedSale: row.has_suggested_sale,
    classificationConfidence: row.classification_confidence,
    analysisStatus: row.analysis_status,
    scoreAttention: analysis?.score_attention ?? null,
    scoreSales: analysis?.score_sales ?? null,
    missedOpportunity: analysis?.missed_opportunity ?? null,
    summary: analysis?.summary ?? null,
    improvementTip: analysis?.improvement_tip ?? null,
  };
}

export async function getSegmentsForList(query) {
  const where = buildWhereFromQuery(query);
  const limit = Number(query.limit || 50);
  const offset = Number(query.offset || 0);

  const { count, rows } = await AudioSegment.findAndCountAll({
    where,
    include: [
      {
        model: AudioSegmentAnalysis,
        as: "analysis",
        required: false,
      },
    ],
    order: [["createdAt", "DESC"]],
    limit,
    offset,
  });

  return {
    total: count,
    data: rows.map(mapSegmentRow),
  };
}

export async function getSegmentDetail(id) {
  const row = await AudioSegment.findByPk(id, {
    include: [
      {
        model: AudioSegmentAnalysis,
        as: "analysis",
        required: false,
      },
    ],
  });

  if (!row) return null;

  return {
    id: row.id,
    segmentId: row.segment_id,
    sucursalCodigo: row.sucursal_codigo,
    fecha: row.fecha,
    fileName: row.file_name,
    createdAtLocal: row.created_at_local,
    durationMs: row.duration_ms,
    sampleRate: row.sample_rate,
    reason: row.reason,
    transcriptionStatus: row.transcription_status,
    transcriptionText: row.transcription_text,
    transcriptionEngine: row.transcription_engine,
    transcriptionModel: row.transcription_model,
    transcriptionUpdatedAt: row.transcription_updated_at,
    hasText: row.has_text,
    hasQuestion: row.has_question,
    hasRecommendation: row.has_recommendation,
    hasOffer: row.has_offer,
    hasSuggestedSale: row.has_suggested_sale,
    classificationConfidence: row.classification_confidence,
    classification: row.classification_json,
    metadata: row.metadata_json,
    analysisStatus: row.analysis_status,
    analysis: row.analysis
      ? {
          id: row.analysis.id,
          hadRecommendation: row.analysis.had_recommendation,
          hadSuggestedSale: row.analysis.had_suggested_sale,
          missedOpportunity: row.analysis.missed_opportunity,
          scoreAttention: row.analysis.score_attention,
          scoreSales: row.analysis.score_sales,
          summary: row.analysis.summary,
          improvementTip: row.analysis.improvement_tip,
          rawResponse: row.analysis.raw_response_json,
          createdAt: row.analysis.createdAt,
          updatedAt: row.analysis.updatedAt,
        }
      : null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function getDashboardSummary(query) {
  const where = buildWhereFromQuery(query);

  const segments = await AudioSegment.findAll({
    where,
    include: [
      {
        model: AudioSegmentAnalysis,
        as: "analysis",
        required: false,
      },
    ],
  });

  const totalSegments = segments.length;
  const withRecommendation = segments.filter((s) => s.has_recommendation).length;
  const withSuggestedSale = segments.filter((s) => s.has_suggested_sale).length;
  const withQuestion = segments.filter((s) => s.has_question).length;

  const analyzed = segments.filter((s) => s.analysis).length;
  const missedOpportunity = segments.filter(
    (s) => s.analysis?.missed_opportunity
  ).length;

  const attentionScores = segments
    .map((s) => s.analysis?.score_attention)
    .filter((v) => typeof v === "number");

  const salesScores = segments
    .map((s) => s.analysis?.score_sales)
    .filter((v) => typeof v === "number");

  const avgAttention =
    attentionScores.length > 0
      ? attentionScores.reduce((acc, n) => acc + n, 0) / attentionScores.length
      : 0;

  const avgSales =
    salesScores.length > 0
      ? salesScores.reduce((acc, n) => acc + n, 0) / salesScores.length
      : 0;

  return {
    totalSegments,
    analyzed,
    withQuestion,
    withRecommendation,
    withSuggestedSale,
    missedOpportunity,
    avgAttention: Number(avgAttention.toFixed(2)),
    avgSales: Number(avgSales.toFixed(2)),
  };
}