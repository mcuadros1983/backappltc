import { ingestAudioSegment } from "../../services/audio/audioIngestionService.js";
import {
  getSegmentsForList,
  getSegmentDetail,
  getDashboardSummary,
} from "../../services/audio/audioQueryService.js";

export const createSegment = async (req, res) => {
  try {
    const result = await ingestAudioSegment(req.body);

    if (result.duplicate) {
      return res.status(200).json({
        ok: true,
        duplicate: true,
        message: "Segmento ya existente",
        data: {
          id: result.segment.id,
          segmentId: result.segment.segment_id,
        },
      });
    }

    return res.status(201).json({
      ok: true,
      duplicate: false,
      message: "Segmento creado correctamente",
      data: {
        id: result.segment.id,
        segmentId: result.segment.segment_id,
        analysisStatus: result.segment.analysis_status,
      },
    });
  } catch (error) {
    console.error("Error createSegment:", error);
    return res.status(400).json({
      ok: false,
      error: error.message || "No se pudo crear el segmento",
    });
  }
};

export const listSegments = async (req, res) => {
  try {
    const result = await getSegmentsForList(req.query);

    return res.json({
      ok: true,
      total: result.total,
      data: result.data,
    });
  } catch (error) {
    console.error("Error listSegments:", error);
    return res.status(500).json({
      ok: false,
      error: "No se pudieron listar los segmentos",
    });
  }
};

export const getSegmentById = async (req, res) => {
  try {
    const data = await getSegmentDetail(req.params.id);

    if (!data) {
      return res.status(404).json({
        ok: false,
        error: "Segmento no encontrado",
      });
    }

    return res.json({
      ok: true,
      data,
    });
  } catch (error) {
    console.error("Error getSegmentById:", error);
    return res.status(500).json({
      ok: false,
      error: "No se pudo obtener el segmento",
    });
  }
};

export const dashboardSummary = async (req, res) => {
  try {
    const data = await getDashboardSummary(req.query);

    return res.json({
      ok: true,
      data,
    });
  } catch (error) {
    console.error("Error dashboardSummary:", error);
    return res.status(500).json({
      ok: false,
      error: "No se pudo generar el dashboard",
    });
  }
};