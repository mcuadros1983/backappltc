// server/controllers/gmedia/haciendaController.js
import { Op } from "sequelize";
import { sequelize } from "../../config/database.js";
import Hacienda from "../../models/gmedia/hacienda.js";
import RegistroHacienda from "../../models/gmedia/registrohacienda.js";

/* =======================
   Helpers
======================= */
const N = (v) => Number(v) || 0;

// const calcularCamposItem = (it = {}) => {
//   const pesoneto = N(it.pesoneto);
//   const preciokgvivo = N(it.preciokgvivo);
//   const importeneto = pesoneto * preciokgvivo;

//   // OJO: el modelo usa 'comsion' (typo) -> mantener ese nombre
//   const costos =
//     N(it.flete) +
//     N(it.comsion) +
//     N(it.viaticos) +
//     N(it.imptoalcheque) +
//     N(it.gastosfaena);

//   const montototal = importeneto + costos;

//   let rendimiento = null;
//   if (it.kgsromaneo && pesoneto > 0) {
//     rendimiento = (N(it.kgsromaneo) / pesoneto) * 100;
//   }

//   return {
//     ...it,
//     importeneto: Number(importeneto.toFixed(2)),
//     montototal: Number(montototal.toFixed(2)),
//     rendimiento: rendimiento !== null ? Number(rendimiento.toFixed(2)) : null,
//   };
// };

// Asumo que N(x) => Number(x) || 0
const calcularCamposItem = (it = {}) => {
  const safeNum = (v, d = 2) => {
    const n = Number(v);
    return Number.isFinite(n) ? Number(n.toFixed(d)) : 0;
  };

  const pesoneto = N(it.pesoneto);                   // suele ser PROMEDIO por animal
  const cant     = N(it.cantidadanimales);
  const kgRom    = N(it.kgsromaneo);
  const pkvivo   = N(it.preciokgvivo);

  // Vivo total: si mandan explícito 'kgvivototal', úsalo; sino promedio*cantidad; sino pesoneto
  const kgVivoTotal = it.kgvivototal != null
    ? N(it.kgvivototal)
    : (cant > 0 ? (pesoneto * cant) : pesoneto);

  // Importes
  const importeneto = pesoneto * pkvivo; // si pesoneto es promedio, este es por animal; tu flujo lo suma fuera
  const costos =
    N(it.flete) +
    N(it.comsion) +  // (typo en modelo)
    N(it.viaticos) +
    N(it.imptoalcheque) +
    N(it.gastosfaena);

  const montototal = importeneto + costos;

  // Rendimiento %
  let rendimiento = null;
  if (kgVivoTotal > 0 && kgRom > 0) {
    const r = (kgRom / kgVivoTotal) * 100;
    const r2 = Number(r.toFixed(2));
    // si queda fuera de rango razonable, lo anulamos para no grabar basura
    rendimiento = (r2 >= 0 && r2 <= 100) ? r2 : null;
  }

  // Precio kg carne
  let preciokgcarne = (it.preciokgcarne != null && Number.isFinite(Number(it.preciokgcarne)))
    ? safeNum(it.preciokgcarne)
    : (kgRom > 0 ? safeNum(montototal / kgRom) : 0);

  return {
    ...it,
    // Normalizaciones con 2 decimales
    pesoneto:        safeNum(pesoneto),
    preciokgvivo:    safeNum(pkvivo),
    importeneto:     safeNum(importeneto),
    flete:           safeNum(it.flete),
    comsion:         safeNum(it.comsion),
    viaticos:        safeNum(it.viaticos),
    imptoalcheque:   safeNum(it.imptoalcheque),
    gastosfaena:     safeNum(it.gastosfaena),
    montototal:      safeNum(montototal),
    kgsromaneo:      safeNum(kgRom),
    preciokgcarne:   preciokgcarne,
    rendimiento,     // puede ser null si no es válido
  };
};


// const recalcularMontoHacienda = async (hacienda_id, t) => {
//   const [{ total }] =
//     (await RegistroHacienda.findAll({
//       attributes: [[sequelize.fn("SUM", sequelize.col("montototal")), "total"]],
//       where: { hacienda_id, anulado: false },
//       raw: true,
//       transaction: t,
//     })) || [{ total: 0 }];

//   await Hacienda.update(
//     { monto: Number(total || 0).toFixed(2) },
//     { where: { id: hacienda_id }, transaction: t }
//   );
// };

export const recalcularMontoYEstadoHacienda = async (hacienda_id, t) => {
  // total de montos de ítems NO anulados
  const [{ total }] =
    (await RegistroHacienda.findAll({
      attributes: [[sequelize.fn("SUM", sequelize.col("montototal")), "total"]],
      where: { hacienda_id, anulado: false },
      raw: true,
      transaction: t,
    })) || [{ total: 0 }];

  // cuántos ítems NO anulados quedan
  const activos = await RegistroHacienda.count({
    where: { hacienda_id, anulado: false },
    transaction: t,
  });

  await Hacienda.update(
    {
      monto: Number(total || 0).toFixed(2),
      anulado: activos === 0, // 👈 si no queda ningún ítem activo, anula el header
    },
    { where: { id: hacienda_id }, transaction: t }
  );
};

/* =======================
   Controllers
======================= */

// Crea la Hacienda + items (uno o varios)
export const crearHacienda = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const {
      fecha,
      proveedor_id: proveedorHeader,
      comprobante_id = null,
      observaciones = null,
      monto,
      items = [],
      // header opcional si no hay items (o para forzar valores)
      empresa_id: empresaHeader,
      frigorifico_id: frigorificoHeader,
    } = req.body;

    if (!fecha) throw new Error("fecha requerida");
    if ((!Array.isArray(items) || items.length === 0) && !(Number(monto) > 0)) {
      throw new Error("Debe enviar items o un monto");
    }

    // Tomar valores del primer ítem si no están en el header
    const first = Array.isArray(items) && items.length ? items[0] : null;

    const empresa_id = Number(
      (first && first.empresa_id != null ? first.empresa_id : empresaHeader)
    ) || null;

    const frigorifico_id = Number(
      (first && first.frigorifico_id != null ? first.frigorifico_id : frigorificoHeader)
    ) || null;

    const proveedor_id = Number(
      (proveedorHeader != null ? proveedorHeader : first?.proveedor_id)
    ) || null;

    if (!empresa_id) throw new Error("empresa_id requerido");
    if (!frigorifico_id) throw new Error("frigorifico_id requerido");
    if (!proveedor_id) throw new Error("proveedor_id requerido");

    let total = 0;

    const hacienda = await Hacienda.create(
      {
        fecha,
        proveedor_id,
        comprobante_id: comprobante_id ? Number(comprobante_id) : null,
        observaciones: observaciones || null,
        monto: 0,
        anulado: false,
        empresa_id,
        frigorifico_id,
      },
      { transaction: t }
    );

    if (Array.isArray(items) && items.length) {
      const preparados = items.map((raw) => {
        const it = calcularCamposItem({ ...raw, hacienda_id: hacienda.id });

        // Normalización numérica
        const num = (v, d = 2) => {
          const n = Number(v);
          return Number.isFinite(n) ? Number(n.toFixed(d)) : 0;
        };

        it.pesoneto = num(it.pesoneto);
        it.preciokgvivo = num(it.preciokgvivo);
        it.importeneto = num(it.importeneto);
        it.flete = num(it.flete);
        it.comsion = num(it.comsion);
        it.viaticos = num(it.viaticos);
        it.imptoalcheque = num(it.imptoalcheque);
        it.gastosfaena = num(it.gastosfaena);
        it.montototal = num(it.montototal);
        it.kgsromaneo = num(it.kgsromaneo);
        it.rendimiento = it.rendimiento != null ? num(it.rendimiento) : null;

        // Asegurar preciokgcarne (si no viene, calcular = total / romaneo)
        const kgRom = Number(it.kgsromaneo) || 0;
        if (it.preciokgcarne == null || !Number.isFinite(Number(it.preciokgcarne))) {
          it.preciokgcarne = kgRom > 0 ? num(Number(it.montototal || 0) / kgRom) : 0;
        } else {
          it.preciokgcarne = num(it.preciokgcarne);
        }

        it.anulado = false;
        return it;
      });
      console.log("preparados", preparados)
      await RegistroHacienda.bulkCreate(preparados, { transaction: t });


      total = preparados.reduce((a, b) => a + (Number(b.montototal) || 0), 0);

    } else {
      total = Number(monto) || 0;
    }
    console.log("total", total)

    await hacienda.update({ monto: Number(total.toFixed(2)) }, { transaction: t });

    await t.commit();
    return res.status(201).json(hacienda);
  } catch (err) {
    await t.rollback();
    console.error("❌ crearHacienda:", err);
    return res.status(400).json({ error: err.message || "No se pudo crear Hacienda" });
  }
};

// Lista headers Hacienda (sin items) con filtros básicos
export const listarHacienda = async (req, res) => {
  try {
    const { fecha_desde, fecha_hasta, proveedor_id, q, includeAnulados = "0", limit = 100, offset = 0 } = req.query;

    const where = {};
    if (includeAnulados !== "1") where.anulado = false;

    if (fecha_desde || fecha_hasta) {
      where.fecha = {};
      if (fecha_desde) where.fecha[Op.gte] = fecha_desde;
      if (fecha_hasta) where.fecha[Op.lte] = fecha_hasta;
    }
    if (proveedor_id) where.proveedor_id = Number(proveedor_id);
    if (q) where.observaciones = { [Op.iLike]: `%${q}%` };

    const rows = await Hacienda.findAll({
      where,
      order: [["fecha", "ASC"], ["id", "ASC"]],
      limit: Number(limit),
      offset: Number(offset),
    });

    return res.json(rows);
  } catch (err) {
    console.error("❌ listarHacienda:", err);
    return res.status(400).json({ error: "No se pudo listar Hacienda" });
  }
};

// Lista headers Hacienda DISPONIBLES (= sin comprobante vinculado) con filtros
export const listarHaciendaDisponibles = async (req, res) => {
  try {
    const {
      proveedor_id,
      empresa_id,
      fecha_desde,
      fecha_hasta,
      q,                 // búsqueda libre (opcional)
      limit = 100,
      offset = 0,
      comprobante_id,    // <— NUEVO (opcional)
    } = req.query;

    const where = {
      anulado: false,
      // DISPONIBLES: comprobante_id IS NULL
      // Si viene comprobante_id, también permitimos la que ya esté ligada a ese comprobante.
      [Op.or]: [
        { comprobante_id: { [Op.is]: null } },
        ...(comprobante_id ? [{ comprobante_id: Number(comprobante_id) }] : []),
      ],
    };

    if (proveedor_id) where.proveedor_id = Number(proveedor_id);
    if (empresa_id) where.empresa_id = Number(empresa_id);

    if (fecha_desde || fecha_hasta) {
      where.fecha = {};
      if (fecha_desde) where.fecha[Op.gte] = fecha_desde;
      if (fecha_hasta) where.fecha[Op.lte] = fecha_hasta;
    }

    if (q) where.observaciones = { [Op.iLike]: `%${q}%` };

    const rows = await Hacienda.findAll({
      where,
      order: [["fecha", "ASC"], ["id", "ASC"]],
      limit: Number(limit),
      offset: Number(offset),
      include: [
        {
          model: RegistroHacienda,
          as: "items",
          attributes: ["id"],
          required: false,
          where: { anulado: false },
          separate: true,
        },
      ],
    });

    const result = rows.map(h => ({
      id: h.id,
      fecha: h.fecha,
      proveedor_id: h.proveedor_id,
      empresa_id: h.empresa_id,
      frigorifico_id: h.frigorifico_id,
      observaciones: h.observaciones,
      monto: Number(h.monto || 0),
      comprobante_id: h.comprobante_id,   // puede ser null o = comprobante_id recibido
      anulado: !!h.anulado,
      items_activos: Array.isArray(h.items) ? h.items.length : 0,
    }));

    return res.json(result);
  } catch (err) {
    console.error("❌ listarHaciendaDisponibles:", err);
    return res.status(400).json({ error: "No se pudo listar Hacienda disponibles" });
  }
};
// Ítems (RegistroHacienda) ACTIVOS de un header (para seleccionar uno)
export const listarItemsDisponiblesPorHacienda = async (req, res) => {
  try {
    const { id } = req.params; // hacienda_id
    const hac = await Hacienda.findByPk(id);
    if (!hac) return res.status(404).json({ error: "Hacienda no encontrada" });
    if (hac.anulado) return res.status(400).json({ error: "La Hacienda está anulada" });
    if (hac.comprobante_id != null) {
      return res.status(400).json({ error: "La Hacienda ya está vinculada a un comprobante" });
    }

    const items = await RegistroHacienda.findAll({
      where: { hacienda_id: Number(id), anulado: false },
      order: [["id", "ASC"]],
      // devolvemos campos clave para seleccionar
      attributes: [
        "id",
        "fecha",
        "proveedor_id",
        "empresa_id",
        "frigorifico_id",
        "pesoneto",
        "preciokgvivo",
        "importeneto",
        "flete",
        "comsion",
        "viaticos",
        "imptoalcheque",
        "gastosfaena",
        "montototal",
        "kgsromaneo",
        "rendimiento",
      ],
    });

    return res.json(items);
  } catch (err) {
    console.error("❌ listarItemsDisponiblesPorHacienda:", err);
    return res.status(400).json({ error: "No se pudieron listar ítems disponibles" });
  }
};



// Trae un header + sus items
export const obtenerHaciendaPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const { includeAnulados = "0" } = req.query;

    const row = await Hacienda.findByPk(id, {
      include: [
        {
          model: RegistroHacienda,
          as: "items",
          required: false,
          separate: true,
          where: includeAnulados === "1" ? undefined : { anulado: false },
          order: [["id", "ASC"]],
        },
      ],
    });

    if (!row) return res.status(404).json({ error: "Hacienda no encontrada" });
    return res.json(row);
  } catch (err) {
    console.error("❌ obtenerHaciendaPorId:", err);
    return res.status(400).json({ error: "No se pudo obtener Hacienda" });
  }
};

// Actualiza campos del header (no items)
export const actualizarHacienda = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { fecha, proveedor_id, comprobante_id, observaciones, monto, anulado } = req.body;

    const row = await Hacienda.findByPk(id, { transaction: t });
    if (!row) throw new Error("Hacienda no encontrada");

    await row.update(
      {
        ...(fecha ? { fecha } : {}),
        ...(proveedor_id ? { proveedor_id: Number(proveedor_id) } : {}),
        ...(comprobante_id !== undefined ? { comprobante_id: comprobante_id ? Number(comprobante_id) : null } : {}),
        ...(observaciones !== undefined ? { observaciones: observaciones || null } : {}),
        ...(monto !== undefined ? { monto: Number(N(monto).toFixed(2)) } : {}),
        ...(anulado !== undefined ? { anulado: !!anulado } : {}),
      },
      { transaction: t }
    );

    await t.commit();
    return res.json(row);
  } catch (err) {
    await t.rollback();
    console.error("❌ actualizarHacienda:", err);
    return res.status(400).json({ error: err.message || "No se pudo actualizar Hacienda" });
  }
};

// Anula la Hacienda (soft delete) y sus items
export const anularHacienda = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;

    const row = await Hacienda.findByPk(id, { transaction: t });
    if (!row) return res.status(404).json({ error: "Hacienda no encontrada" });

    if (row.anulado) {
      await t.commit();
      return res.json({ ok: true, mensaje: "Ya estaba anulada" });
    }

    await row.update({ anulado: true, monto: 0 }, { transaction: t });
    await RegistroHacienda.update({ anulado: true }, { where: { hacienda_id: id }, transaction: t });

    await t.commit();
    return res.json({ ok: true, mensaje: "Hacienda anulada" });
  } catch (err) {
    await t.rollback();
    console.error("❌ anularHacienda:", err);
    return res.status(400).json({ error: "No se pudo anular Hacienda" });
  }
};

// Restaura header (no restaura items automáticamente)
export const restaurarHacienda = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;

    const row = await Hacienda.findByPk(id, { transaction: t });
    if (!row) return res.status(404).json({ error: "Hacienda no encontrada" });

    if (!row.anulado) {
      await t.commit();
      return res.json({ ok: true, mensaje: "Ya estaba activa" });
    }

    await row.update({ anulado: false }, { transaction: t });
    await recalcularMontoYEstadoHacienda(id, t); (id, t);

    await t.commit();
    return res.json({ ok: true, mensaje: "Hacienda restaurada" });
  } catch (err) {
    await t.rollback();
    console.error("❌ restaurarHacienda:", err);
    return res.status(400).json({ error: "No se pudo restaurar Hacienda" });
  }
};

// Compatibilidad con DELETE físico
export const eliminarHacienda = async (req, res) => {
  return anularHacienda(req, res);
};
