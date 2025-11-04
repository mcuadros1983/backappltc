// controllers/subcategoriasController.js
import DocumentoSubcategoria from "../../models/documentacion/DocumentoSubcategoria.js";
import DocumentoCategoria from "../../models/documentacion/DocumentoCategoria.js";
import { isAdmin } from "../../utils/roles.js";

// GET /documentos/subcategorias?categoria_id=NN
// Devuelve solo las subcategorías activas que el usuario tiene permiso de ver
export async function listSubcategorias(req, res) {
  try {
    const userRolId = req.user?.rol_id;
    const { categoria_id } = req.query;

    const where = { activo: true };
    if (categoria_id) {
      where.categoria_id = categoria_id;
    }

    const subs = await DocumentoSubcategoria.findAll({
      where,
      include: [
        {
          model: DocumentoCategoria,
          as: "categoria",
          required: false,
          attributes: ["id", "nombre", "activo"],
        },
      ],
      order: [["nombre", "ASC"]],
    });

    // filtramos por roles_permitidos
    const visibles = subs.filter((sc) => {
      const allowed = Array.isArray(sc.roles_permitidos)
        ? sc.roles_permitidos.map(String)
        : [];
      return allowed.includes(String(userRolId));
    });

    return res.json(visibles);
  } catch (err) {
    console.error("listSubcategorias error:", err);
    return res.status(500).json({ error: "Error listando subcategorías" });
  }
}

// POST /documentos/subcategorias
export async function createSubcategoria(req, res) {
  try {
    const { rol_id } = req.user || {};
    if (!isAdmin(rol_id)) {
      return res.status(403).json({ error: "Solo admin puede crear subcategorías" });
    }

    const { categoria_id, nombre, roles_permitidos } = req.body;

    if (!categoria_id || !nombre) {
      return res
        .status(400)
        .json({ error: "Falta categoria_id o nombre" });
    }

    const sub = await DocumentoSubcategoria.create({
      categoria_id,
      nombre,
      roles_permitidos: Array.isArray(roles_permitidos)
        ? roles_permitidos
        : [],
      activo: true,
    });

    return res.status(201).json(sub);
  } catch (err) {
    console.error("createSubcategoria error:", err);
    return res.status(500).json({ error: "Error creando subcategoría" });
  }
}

// PUT /documentos/subcategorias/:id
export async function updateSubcategoria(req, res) {
  try {
    const { rol_id } = req.user || {};
    if (!isAdmin(rol_id)) {
      return res.status(403).json({ error: "Solo admin puede editar subcategorías" });
    }

    const { id } = req.params;
    const { categoria_id, nombre, roles_permitidos, activo } = req.body;

    const sub = await DocumentoSubcategoria.findByPk(id);
    if (!sub) {
      return res.status(404).json({ error: "Subcategoría no encontrada" });
    }

    await sub.update({
      categoria_id: categoria_id ?? sub.categoria_id,
      nombre: nombre ?? sub.nombre,
      roles_permitidos:
        roles_permitidos !== undefined
          ? Array.isArray(roles_permitidos)
            ? roles_permitidos
            : sub.roles_permitidos
          : sub.roles_permitidos,
      activo: activo === undefined ? sub.activo : !!activo,
    });

    return res.json(sub);
  } catch (err) {
    console.error("updateSubcategoria error:", err);
    return res.status(500).json({ error: "Error editando subcategoría" });
  }
}

// DELETE /documentos/subcategorias/:id  (soft delete)
export async function removeSubcategoria(req, res) {
  try {
    const { rol_id } = req.user || {};
    if (!isAdmin(rol_id)) {
      return res.status(403).json({ error: "Solo admin puede eliminar subcategorías" });
    }

    const { id } = req.params;
    const sub = await DocumentoSubcategoria.findByPk(id);
    if (!sub) {
      return res.status(404).json({ error: "Subcategoría no encontrada" });
    }

    await sub.update({ activo: false });
    return res.json({ ok: true });
  } catch (err) {
    console.error("removeSubcategoria error:", err);
    return res.status(500).json({ error: "Error eliminando subcategoría" });
  }
}
