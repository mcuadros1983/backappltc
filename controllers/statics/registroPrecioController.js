// server/controllers/statics/registroPrecioController.js
import { Op } from "sequelize";
import RegistroPrecio from "../../models/statics/registroPrecioModel.js";

/* =========================
   Helpers
   ========================= */
function toDateOnly(d) {
  if (!d) return null;
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return null;
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const day = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/* =========================
   Listar (con filtros + paginación)
   GET /registro-precios
   Query:
     - articulo_id, codigobarra
     - desde, hasta  (rango de fecha)
     - page=1, pageSize=20
     - orderBy=fecha|precio|id, orderDir=ASC|DESC
   ========================= */
export async function listarRegistroPrecios(req, res) {
  try {
    const {
      articulo_id,
      codigobarra,
      desde,
      hasta,
      page = 1,
      pageSize = 20,
      orderBy = "fecha",
      orderDir = "DESC",
    } = req.query;

    const where = {};
    if (articulo_id) where.articulo_id = Number(articulo_id);
    if (codigobarra) where.codigobarra = String(codigobarra);

    const d = toDateOnly(desde);
    const h = toDateOnly(hasta);
    if (d || h) {
      where.fecha = {};
      if (d) where.fecha[Op.gte] = d;
      if (h) where.fecha[Op.lte] = h;
    }

    const validOrderBy = new Set(["id", "fecha", "precio", "articulo_id", "codigobarra"]);
    const ob = validOrderBy.has(orderBy) ? orderBy : "fecha";
    const od = String(orderDir).toUpperCase() === "ASC" ? "ASC" : "DESC";

    const limit = Math.max(1, Number(pageSize) || 20);
    const offset = Math.max(0, (Number(page) - 1) * limit);

    const { rows, count } = await RegistroPrecio.findAndCountAll({
      where,
      order: [[ob, od], ["id", "DESC"]],
      limit,
      offset,
    });

    return res.json({
      total: count,
      page: Number(page),
      pageSize: limit,
      rows,
    });
  } catch (err) {
    console.error("❌ listarRegistroPrecios:", err);
    return res.status(500).json({ error: "Error al listar precios" });
  }
}

/* =========================
   Obtener uno
   GET /registro-precios/:id
   ========================= */
export async function obtenerRegistroPrecio(req, res) {
  try {
    const { id } = req.params;
    const item = await RegistroPrecio.findByPk(id);
    if (!item) return res.status(404).json({ error: "Registro de precio no encontrado" });
    return res.json(item);
  } catch (err) {
    console.error("❌ obtenerRegistroPrecio:", err);
    return res.status(500).json({ error: "Error al obtener el registro de precio" });
  }
}

/* =========================
   Crear
   POST /registro-precios
   Body: { precio, articulo_id?, codigobarra?, fecha? }
   Regla: al menos uno entre articulo_id o codigobarra
   Unique: (articulo_id, codigobarra, fecha)
   ========================= */
export async function crearRegistroPrecio(req, res) {
  try {
    const { precio, articulo_id, codigobarra } = req.body;
    let { fecha } = req.body;

    if (precio == null || Number.isNaN(Number(precio))) {
      return res.status(400).json({ error: "precio requerido (número)" });
    }
    if (!articulo_id && !codigobarra) {
      return res.status(400).json({ error: "Debe proveer articulo_id o codigobarra" });
    }

    fecha = toDateOnly(fecha) || toDateOnly(new Date());

    try {
      const nuevo = await RegistroPrecio.create({
        precio: Number(precio),
        articulo_id: articulo_id != null ? Number(articulo_id) : null,
        codigobarra: codigobarra || null,
        fecha,
      });
      return res.status(201).json(nuevo);
    } catch (e) {
      // Unique constraint
      if (e?.name === "SequelizeUniqueConstraintError") {
        return res.status(409).json({
          error: "Ya existe un registro para ese (articulo_id, codigobarra, fecha)",
        });
      }
      throw e;
    }
  } catch (err) {
    console.error("❌ crearRegistroPrecio:", err);
    return res.status(500).json({ error: "Error al crear registro de precio" });
  }
}

/* =========================
   Actualizar
   PUT /registro-precios/:id
   Body: { precio?, articulo_id?, codigobarra?, fecha? }
   ========================= */
export async function actualizarRegistroPrecio(req, res) {
  try {
    const { id } = req.params;
    const item = await RegistroPrecio.findByPk(id);
    if (!item) return res.status(404).json({ error: "Registro de precio no encontrado" });

    const data = {};
    if (req.body.precio != null) {
      if (Number.isNaN(Number(req.body.precio))) {
        return res.status(400).json({ error: "precio debe ser numérico" });
      }
      data.precio = Number(req.body.precio);
    }
    if ("articulo_id" in req.body) data.articulo_id = req.body.articulo_id != null ? Number(req.body.articulo_id) : null;
    if ("codigobarra" in req.body) data.codigobarra = req.body.codigobarra || null;
    if ("fecha" in req.body) {
      const f = toDateOnly(req.body.fecha);
      if (!f) return res.status(400).json({ error: "fecha inválida (YYYY-MM-DD)" });
      data.fecha = f;
    }

    // Regla: al menos uno entre articulo_id o codigobarra (post update)
    const nextArticulo = "articulo_id" in data ? data.articulo_id : item.articulo_id;
    const nextCodigo = "codigobarra" in data ? data.codigobarra : item.codigobarra;
    if (!nextArticulo && !nextCodigo) {
      return res.status(400).json({ error: "Debe quedar definido articulo_id o codigobarra" });
    }

    try {
      await item.update(data);
      return res.json(item);
    } catch (e) {
      if (e?.name === "SequelizeUniqueConstraintError") {
        return res.status(409).json({
          error: "Ya existe un registro para ese (articulo_id, codigobarra, fecha)",
        });
      }
      throw e;
    }
  } catch (err) {
    console.error("❌ actualizarRegistroPrecio:", err);
    return res.status(500).json({ error: "Error al actualizar el registro de precio" });
  }
}

/* =========================
   Eliminar
   DELETE /registro-precios/:id
   ========================= */
export async function eliminarRegistroPrecio(req, res) {
  try {
    const { id } = req.params;
    const item = await RegistroPrecio.findByPk(id);
    if (!item) return res.status(404).json({ error: "Registro de precio no encontrado" });

    await item.destroy();
    return res.json({ mensaje: "Registro de precio eliminado" });
  } catch (err) {
    console.error("❌ eliminarRegistroPrecio:", err);
    return res.status(500).json({ error: "Error al eliminar el registro de precio" });
  }
}
