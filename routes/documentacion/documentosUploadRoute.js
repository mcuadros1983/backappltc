// routes/documentosUploadRoute.js
import express from "express";
import multer from "multer";
import { uploadToDrive } from "../../services/googleDriveService.js";

// configuramos multer para escribir archivos temporales a /tmp o similar
const upload = multer({ dest: "/tmp" });

const documentosUploadRouter = express.Router();

// Middleware auth esperado: req.user.rol_id
// Sólo admin puede subir adjuntos
function isAdmin(rol_id) {
  return String(rol_id) === "1";
}

// POST /documentos/upload
// FormData: { file: <binary> }
documentosUploadRouter.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const rol_id = req.user?.rol_id;
    if (!isAdmin(rol_id)) {
      return res.status(403).json({ error: "Solo admin puede subir archivos" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No se envió archivo" });
    }

    const { originalname, mimetype, path: localPath } = req.file;

    // subimos a Drive
    const driveInfo = await uploadToDrive({
      originalName: originalname,
      mimeType: mimetype,
      localPath,
    });

    // armamos objeto adjunto listo para usar en el modal
    // OJO: no guardamos en DB acá todavía, eso sigue pasando cuando se guarda el Documento.
    const adjunto = {
      filename_original: originalname,
      mime_type: mimetype,
      // usamos webViewLink como "url_storage" para abrirlo en Drive
      url_storage: driveInfo.webViewLink || driveInfo.webContentLink,
      drive_file_id: driveInfo.fileId,
      es_obligatorio_leer: false,
      orden: 1,
    };

    return res.json({
      ok: true,
      adjunto,
    });
  } catch (err) {
    console.error("Error subiendo archivo a Drive:", err);
    return res
      .status(500)
      .json({ error: "Error subiendo archivo a Drive" });
  }
});

export default documentosUploadRouter;
