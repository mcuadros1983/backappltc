// routes/documentacion/documentosRoutes.js
import express from "express";
import multer from "multer";

import JWTAuth from "../../middleware/jwtMiddleware.js";

import {
  list,
  getById,
  create,
  update,
  remove,
  uploadArchivo,deleteArchivoDrive
} from "../../controllers/documentacion/documentosController.js";

import {
  listCategorias,
  createCategoria,
  updateCategoria,
  removeCategoria,
} from "../../controllers/documentacion/documentosCategoriasController.js";

import {
  listSubcategorias,
  createSubcategoria,
  updateSubcategoria,
  removeSubcategoria,
} from "../../controllers/documentacion/documentosSubcategoriasController.js";

const documentosRouter = express.Router();
const upload = multer({ dest: "uploads_tmp/" });

// ---------------- CATEGORIAS ----------------
// OJO: van antes que /documentos/:id para que no las atrape como :id
documentosRouter.get("/documentos/categorias", listCategorias);

// Solo admin debería poder crear/editar/eliminar categoría
documentosRouter.post(
  "/documentos/categorias",

  createCategoria
);

documentosRouter.put(
  "/documentos/categorias/:id",

  updateCategoria
);

documentosRouter.delete(
  "/documentos/categorias/:id",

  removeCategoria
);

// ---------------- SUBCATEGORIAS ----------------
documentosRouter.get(
  "/documentos/subcategorias",
  listSubcategorias
);

documentosRouter.post(
  "/documentos/subcategorias",

  createSubcategoria
);

documentosRouter.put(
  "/documentos/subcategorias/:id",

  updateSubcategoria
);

documentosRouter.delete(
  "/documentos/subcategorias/:id",

  removeSubcategoria
);

// ---------------- UPLOAD ARCHIVO ----------------
// subir archivo a Drive y devolver metadata
// esto también debe requerir JWT porque es escritura
documentosRouter.post(
  "/documentos/upload-file",

  upload.single("file"),
  uploadArchivo
);

documentosRouter.delete(
  "/documentos/upload-file/:fileId",
  deleteArchivoDrive
);

// ---------------- DOCUMENTOS ----------------
// listar documentos (público para usuarios logueados en general)
documentosRouter.get("/documentos", list);

// crear documento nuevo (sólo admin, validado también en controller)
documentosRouter.post("/documentos", create);

// obtener detalle de un doc puntual
documentosRouter.get("/documentos/:id", getById);

// editar doc
documentosRouter.put("/documentos/:id", update);

// eliminar doc (soft delete)
documentosRouter.delete("/documentos/:id", remove);

export default documentosRouter;
