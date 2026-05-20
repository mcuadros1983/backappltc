import { Router } from "express";
import {
  createSegment,
  listSegments,
  getSegmentById,
  dashboardSummary,
} from "../../controllers/audio/audioSegmentController.js";
import { requestAudioSync } from "../../controllers/audio/audioSyncController.js";

const audioSegmentsRouter = Router();
const audioSegmentsProtectedRouter = Router();

// Electron
audioSegmentsRouter.post("/api/audio/segments", createSegment);

// Frontend ERP
audioSegmentsProtectedRouter.get("/api/audio/segments", listSegments);
audioSegmentsProtectedRouter.get("/api/audio/segments/:id", getSegmentById);
audioSegmentsProtectedRouter.get("/api/audio/dashboard", dashboardSummary);
audioSegmentsProtectedRouter.post(
  "/api/audio/dashboard/request-sync",
  requestAudioSync
);

export { audioSegmentsRouter, audioSegmentsProtectedRouter };