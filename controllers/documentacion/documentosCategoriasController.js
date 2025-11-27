// controllers/categoriasController.js
import DocumentoCategoria from "../../models/documentacion/DocumentoCategoria.js";
import { isAdmin } from "../../utils/roles.js";

// GET /documentos/categorias
export async function listCategorias(req, res) {
  try {
    console.log("listCategorias called");
    const cats = await DocumentoCategoria.findAll({
      where: { activo: true },
      order: [["nombre", "ASC"]],
    });
    return res.json(cats);
  } catch (err) {
    console.error("listCategorias error:", err);
    return res.status(500).json({ error: "Error listando categorías" });
  }
}

// POST /documentos/categorias
export async function createCategoria(req, res) {
  try {
    const { rol_id, id: user_id } = req.user || {};
    if (!isAdmin(rol_id)) {
      return res.status(403).json({ error: "Solo admin puede crear categorías" });
    }

    // Puede venir:
    // - { nombre: "MANUALES" }
    // - { nombre: { nombre: "MANUALES" } }  (forma vieja)
    let nombre = req.body?.nombre;

    if (typeof nombre === "object" && nombre !== null) {
      nombre = nombre.nombre;
    }

    if (!nombre || typeof nombre !== "string" || !nombre.trim()) {
      return res.status(400).json({ error: "Falta nombre" });
    }

    const cat = await DocumentoCategoria.create({
      nombre: nombre.trim(),
      activo: true,
      creado_por_usuario_id: user_id || null,
    });

    return res.status(201).json(cat);
  } catch (err) {
    console.error("createCategoria error:", err);
    return res.status(500).json({ error: "Error creando categoría" });
  }
}

// PUT /documentos/categorias/:id
export async function updateCategoria(req, res) {
  try {
    const { rol_id } = req.user || {};
    if (!isAdmin(rol_id)) {
      return res.status(403).json({ error: "Solo admin puede editar categorías" });
    }

    const { id } = req.params;
    let { nombre, activo } = req.body;

    // Por si algún cliente viejo aún manda nombre como objeto
    if (typeof nombre === "object" && nombre !== null) {
      nombre = nombre.nombre;
    }

    const cat = await DocumentoCategoria.findByPk(id);
    if (!cat) {
      return res.status(404).json({ error: "Categoría no encontrada" });
    }

    await cat.update({
      nombre: nombre ?? cat.nombre,
      activo: activo === undefined ? cat.activo : !!activo,
    });

    return res.json(cat);
  } catch (err) {
    console.error("updateCategoria error:", err);
    return res.status(500).json({ error: "Error editando categoría" });
  }
}

// DELETE /documentos/categorias/:id
export async function removeCategoria(req, res) {
  try {
    const { rol_id } = req.user || {};
    if (!isAdmin(rol_id)) {
      return res.status(403).json({ error: "Solo admin puede eliminar categorías" });
    }

    const { id } = req.params;
    const cat = await DocumentoCategoria.findByPk(id);
    if (!cat) {
      return res.status(404).json({ error: "Categoría no encontrada" });
    }

    await cat.update({ activo: false });
    return res.json({ ok: true });
  } catch (err) {
    console.error("removeCategoria error:", err);
    return res.status(500).json({ error: "Error eliminando categoría" });
  }
}
