// controllers/documentosController.js
import { sequelize } from "../../config/database.js";
import { Op } from "sequelize";

import Documento from "../../models/documentacion/Documento.js";
import DocumentoPaso from "../../models/documentacion/DocumentoPaso.js";
import DocumentoArchivo from "../../models/documentacion/DocumentoArchivo.js";
import DocumentoSubcategoria from "../../models/documentacion/DocumentoSubcategoria.js";
import DocumentoCategoria from "../../models/documentacion/DocumentoCategoria.js";

import { uploadToDrive, deleteFromDrive } from "../../services/googleDriveService.js";
import { isAdmin } from "../../utils/roles.js";
import fs from "fs";

// helper para chequear si el user puede ver una subcategoría
function subcatVisibleParaRol(subcatInstance, rol_id) {
  if (!subcatInstance) return false;
  const roles = Array.isArray(subcatInstance.roles_permitidos)
    ? subcatInstance.roles_permitidos.map(String)
    : [];
  return roles.includes(String(rol_id));
}

// GET /documentos
// filtros opcionales: ?page=1&limit=20&tipo=PROCESO&q=picadora&vigentesHoy=true&subcategoria_id=3&categoria_id=2
export async function list(req, res) {
  try {
    const rol_id = req.user?.rol_id;
    if (!rol_id) {
      return res.status(401).json({ error: "Sin rol, acceso denegado" });
    }

    const {
      page = 1,
      limit = 20,
      tipo,
      q,
      vigentesHoy,
      subcategoria_id,
      categoria_id,
    } = req.query;

    const whereBase = {
      activo: true,
    };

    if (tipo) {
      whereBase.tipo = tipo;
    }

    if (subcategoria_id) {
      whereBase.subcategoria_id = subcategoria_id;
    }

    // búsqueda por texto libre
    if (q) {
      const like = { [Op.iLike]: `%${q}%` };
      whereBase[Op.or] = [
        { titulo: like },
        { descripcion_resumen: like },
        { contenido: like },
      ];
    }

    // solo comunicaciones vigentes hoy
    if (vigentesHoy === "true") {
      const now = new Date();
      whereBase[Op.and] = [
        {
          [Op.or]: [
            { vigente_desde: null },
            { vigente_desde: { [Op.lte]: now } },
          ],
        },
        {
          [Op.or]: [
            { vigente_hasta: null },
            { vigente_hasta: { [Op.gte]: now } },
          ],
        },
      ];
    }

    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 20;
    const offsetNum = (pageNum - 1) * limitNum;

    // Traemos documentos junto con subcategoria y categoria
    const { rows, count } = await Documento.findAndCountAll({
      where: whereBase,
      include: [
        {
          model: DocumentoSubcategoria,
          as: "subcategoria",
          required: true,
          include: [
            {
              model: DocumentoCategoria,
              as: "categoria",
              required: false,
            },
          ],
        },
      ],
      order: [
        ["publicado_en", "DESC"],
        ["createdAt", "DESC"],
      ],
      offset: offsetNum,
      limit: limitNum,
      attributes: [
        "id",
        "titulo",
        "tipo",
        "descripcion_resumen",
        "vigente_desde",
        "vigente_hasta",
        "version",
        "publicado_en",
        "createdAt",
        "updatedAt",
        "subcategoria_id",
        "activo",
      ],
    });

    // filtrado por categoria_id (ojo: categoria_id vive en subcategoria.categoria_id)
    let filtered = rows;
    if (categoria_id) {
      filtered = filtered.filter(
        (d) => String(d?.subcategoria?.categoria_id) === String(categoria_id)
      );
    }

    // filtrado por visibilidad según rol
    filtered = filtered.filter((d) => subcatVisibleParaRol(d.subcategoria, rol_id));

    return res.json({
      items: filtered,
      total: filtered.length === rows.length ? count : filtered.length,
      page: pageNum,
      limit: limitNum,
    });
  } catch (err) {
    console.error("Error list documentos:", err);
    return res.status(500).json({ error: "Error listando documentos" });
  }
}

// GET /documentos/:id
export async function getById(req, res) {
  try {
    const rol_id = req.user?.rol_id;
    if (!rol_id) {
      return res.status(401).json({ error: "Sin rol, acceso denegado" });
    }

    const { id } = req.params;

    const doc = await Documento.findOne({
      where: { id, activo: true },
      include: [
        {
          model: DocumentoSubcategoria,
          as: "subcategoria",
          required: true,
          include: [
            {
              model: DocumentoCategoria,
              as: "categoria",
              required: false,
            },
          ],
        },
        {
          model: DocumentoPaso,
          as: "pasos",
          required: false,
          order: [["orden", "ASC"]],
        },
        {
          model: DocumentoArchivo,
          as: "archivos",
          required: false,
          order: [["orden", "ASC"]],
          attributes: [
            "id",
            "filename_original",
            "mime_type",
            "url_storage",
            "drive_file_id", // 👈
            "orden",
          ],
        },
      ],
      order: [
        [{ model: DocumentoPaso, as: "pasos" }, "orden", "ASC"],
        [{ model: DocumentoArchivo, as: "archivos" }, "orden", "ASC"],
      ],
    });

    if (!doc) {
      return res.status(404).json({ error: "Documento no encontrado" });
    }

    // chequeo de visibilidad
    if (!subcatVisibleParaRol(doc.subcategoria, rol_id)) {
      return res.status(403).json({ error: "Sin permiso para ver este documento" });
    }

    return res.json(doc);
  } catch (err) {
    console.error("Error getById documento:", err);
    return res.status(500).json({ error: "Error obteniendo documento" });
  }
}

// POST /documentos
// Nota: asumimos que el frontend admin primero sube archivos vía /documentos/upload-file
// y nos manda en body la metadata final (incluyendo archivos [])
export async function create(req, res) {
  const t = await sequelize.transaction();
  try {
    const rol_id = req.user?.rol_id;
    const user_id = req.user?.id;

    if (!isAdmin(rol_id)) {
      await t.rollback();
      return res.status(403).json({ error: "Solo admin puede crear documentos" });
    }

    const {
      titulo,
      tipo,
      subcategoria_id, // NUEVO Y OBLIGATORIO
      descripcion_resumen,
      contenido,
      vigente_desde,
      vigente_hasta,
      version,
      publicado_en,
      pasos = [],
      archivos = [],
    } = req.body;

    if (!subcategoria_id) {
      await t.rollback();
      return res.status(400).json({ error: "Falta subcategoria_id" });
    }

    const newDoc = await Documento.create(
      {
        titulo,
        tipo,
        subcategoria_id,
        descripcion_resumen,
        contenido,
        vigente_desde: vigente_desde || null,
        vigente_hasta: vigente_hasta || null,
        version,
        publicado_en: publicado_en || new Date(),
        creado_por_usuario_id: user_id || null,
        actualizado_por_usuario_id: user_id || null,
        activo: true,
      },
      { transaction: t }
    );

    // pasos
    if (Array.isArray(pasos) && pasos.length > 0) {
      for (const p of pasos) {
        await DocumentoPaso.create(
          {
            documento_id: newDoc.id,
            orden: p.orden ?? 1,
            titulo_paso: p.titulo_paso || null,
            detalle_paso: p.detalle_paso || "",
            responsable: p.responsable || null,
            requiere_foto: !!p.requiere_foto,
          },
          { transaction: t }
        );
      }
    }

    // archivos: acá asumimos que vienen ya con { filename_original, mime_type, url_storage, es_obligatorio_leer, orden }
    if (Array.isArray(archivos) && archivos.length > 0) {
      for (const f of archivos) {
        await DocumentoArchivo.create(
          {
            documento_id: newDoc.id,
            filename_original: f.filename_original,
            mime_type: f.mime_type || null,
            url_storage: f.url_storage,
            drive_file_id: f.drive_file_id, // <- NUEVO
            es_obligatorio_leer: !!f.es_obligatorio_leer,
            orden: f.orden ?? 1,
          },
          { transaction: t }
        );
      }
    }

    await t.commit();

    const fullDoc = await Documento.findByPk(newDoc.id, {
      include: [
        {
          model: DocumentoSubcategoria,
          as: "subcategoria",
          include: [{ model: DocumentoCategoria, as: "categoria" }],
        },
        { model: DocumentoPaso, as: "pasos", order: [["orden", "ASC"]] },
        { model: DocumentoArchivo, as: "archivos", order: [["orden", "ASC"]] },
      ],
      order: [
        [{ model: DocumentoPaso, as: "pasos" }, "orden", "ASC"],
        [{ model: DocumentoArchivo, as: "archivos" }, "orden", "ASC"],
      ],
    });

    return res.status(201).json(fullDoc);
  } catch (err) {
    console.error("Error create documento:", err);
    await t.rollback();
    return res.status(500).json({ error: "Error creando documento" });
  }
}

// PUT /documentos/:id
export async function update(req, res) {
  const t = await sequelize.transaction();
  try {
    const rol_id = req.user?.rol_id;
    const user_id = req.user?.id;
    if (!isAdmin(rol_id)) {
      await t.rollback();
      return res.status(403).json({ error: "Solo admin puede editar documentos" });
    }

    const { id } = req.params;

    const {
      titulo,
      tipo,
      subcategoria_id,
      descripcion_resumen,
      contenido,
      vigente_desde,
      vigente_hasta,
      version,
      publicado_en,
      pasos = null, // null => no tocar
      archivos = null, // null => no tocar
    } = req.body;

    const doc = await Documento.findByPk(id, { transaction: t });
    if (!doc || !doc.activo) {
      await t.rollback();
      return res.status(404).json({ error: "Documento no encontrado" });
    }

    await doc.update(
      {
        titulo: titulo ?? doc.titulo,
        tipo: tipo ?? doc.tipo,
        subcategoria_id: subcategoria_id ?? doc.subcategoria_id,
        descripcion_resumen:
          descripcion_resumen ?? doc.descripcion_resumen,
        contenido: contenido ?? doc.contenido,
        vigente_desde:
          vigente_desde !== undefined ? vigente_desde : doc.vigente_desde,
        vigente_hasta:
          vigente_hasta !== undefined ? vigente_hasta : doc.vigente_hasta,
        version: version ?? doc.version,
        publicado_en: publicado_en ?? doc.publicado_en,
        actualizado_por_usuario_id: user_id || doc.actualizado_por_usuario_id,
      },
      { transaction: t }
    );

    // Reemplazo total de pasos si viene array
    if (Array.isArray(pasos)) {
      await DocumentoPaso.destroy({
        where: { documento_id: id },
        transaction: t,
      });

      for (const p of pasos) {
        await DocumentoPaso.create(
          {
            documento_id: id,
            orden: p.orden ?? 1,
            titulo_paso: p.titulo_paso || null,
            detalle_paso: p.detalle_paso || "",
            responsable: p.responsable || null,
            requiere_foto: !!p.requiere_foto,
          },
          { transaction: t }
        );
      }
    }

    // Reemplazo total de archivos si viene array
    if (Array.isArray(archivos)) {
      await DocumentoArchivo.destroy({
        where: { documento_id: id },
        transaction: t,
      });

      for (const f of archivos) {
        await DocumentoArchivo.create(
          {
            documento_id: id,
            filename_original: f.filename_original,
            mime_type: f.mime_type || null,
            url_storage: f.url_storage,
            es_obligatorio_leer: !!f.es_obligatorio_leer,
            orden: f.orden ?? 1,
          },
          { transaction: t }
        );
      }
    }

    await t.commit();

    // devolver final actualizado
    const fullDoc = await Documento.findByPk(id, {
      include: [
        {
          model: DocumentoSubcategoria,
          as: "subcategoria",
          include: [{ model: DocumentoCategoria, as: "categoria" }],
        },
        { model: DocumentoPaso, as: "pasos", order: [["orden", "ASC"]] },
        { model: DocumentoArchivo, as: "archivos", order: [["orden", "ASC"]] },
      ],
      order: [
        [{ model: DocumentoPaso, as: "pasos" }, "orden", "ASC"],
        [{ model: DocumentoArchivo, as: "archivos" }, "orden", "ASC"],
      ],
    });

    return res.json(fullDoc);
  } catch (err) {
    console.error("Error update documento:", err);
    await t.rollback();
    return res.status(500).json({ error: "Error actualizando documento" });
  }
}

// DELETE /documentos/:id  (soft delete)
export async function remove(req, res) {
  try {
    const rol_id = req.user?.rol_id;
    if (!isAdmin(rol_id)) {
      return res.status(403).json({ error: "Solo admin puede eliminar documentos" });
    }

    const { id } = req.params;
    const doc = await Documento.findByPk(id);
    if (!doc || !doc.activo) {
      return res.status(404).json({ error: "Documento no encontrado" });
    }

    await doc.update({ activo: false });

    return res.json({ ok: true });
  } catch (err) {
    console.error("Error remove documento:", err);
    return res.status(500).json({ error: "Error eliminando documento" });
  }
}

// EXTRA: endpoint para subir un archivo a Drive y devolver la metadata
// POST /documentos/upload-file   (admin)
export async function uploadArchivo(req, res) {
  try {
    const rol_id = req.user?.rol_id;
    if (!isAdmin(rol_id)) {
      return res.status(403).json({ error: "Solo admin puede subir archivos" });
    }

    // multer nos deja el file en req.file
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "Falta archivo" });
    }

    const { originalname, mimetype, path: tempPath } = file;

    const {
      fileId,
      webViewLink,
      webContentLink,
    } = await uploadToDrive({
      originalName: originalname,
      mimeType: mimetype,
      localPath: tempPath,
    });

    // Podés borrar el archivo temporal si querés
    // fs.unlinkSync(tempPath);

    return res.json({
      filename_original: originalname,
      mime_type: mimetype,
      url_storage: webViewLink || webContentLink || "",
      fileId,
    });
  } catch (err) {
    console.error("uploadArchivo error:", err);
    return res.status(500).json({ error: "Error subiendo archivo a Drive" });
  }
}

export async function deleteArchivoDrive(req, res) {
  console.log("⚠️ deleteArchivoDrive llamado");
  const { fileId } = req.params;
  if (!fileId) {
    return res.status(400).json({ error: "Falta fileId" });
  }



  try {
    console.log("⚠️ deleteArchivoDrive llamado con fileId:", fileId);
    await deleteFromDrive(fileId);
    return res.json({ ok: true });
  } catch (err) {
    console.error("deleteArchivoDrive error:", err);
    return res
      .status(500)
      .json({ error: "No se pudo borrar el archivo en Drive" });
  }
}