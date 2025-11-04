import { Op, Sequelize } from "sequelize";
import { sequelize } from "../../config/database.js";
import EcheqEmitido from "../../models/tesoreria/pagoecheq.js";
import CategoriaEgreso from "../../models/tesoreria/categoriaEgreso.js";
import MovimientoBancoTesoreria from "../../models/tesoreria/movimientobancotesoreria.js";
import MovimientoCtaCteProveedor from "../../models/tesoreria/movimientoctacteproveedor.js";
import OrdenPago from "../../models/tesoreria/ordendepago.js";
import FormaPago from "../../models/comun/formapagotesoreria.js";


// si tenés modelos de Banco/Proveedor/Proyecto y querés validar existencia, podés importarlos aquí
const N = (n) => Number(n) || 0;
const toNum = (n) => (n == null || n === "" ? null : Number(n));

/* Aux: deriva imputación desde categoría si no vino */
async function ensureImputacionFromCategoria(categoriaegreso_id, imputacioncontable_id, t) {
  if (imputacioncontable_id) return imputacioncontable_id;
  if (!categoriaegreso_id) return null;
  const cat = await CategoriaEgreso.findByPk(categoriaegreso_id, { transaction: t });
  if (!cat) throw new Error("La categoría indicada no existe");
  if (!cat.imputacioncontable_id) {
    throw new Error("La categoría no tiene imputación contable asociada");
  }
  return cat.imputacioncontable_id;
}

/** Busca el id de la forma de pago “eCheq” por código o nombre. */
async function resolveFormaPagoIdECheq(t) {
  const candidatosCodigo = ["echeq", "e_cheq", "e-cheq", "cheque_electronico"];
  const candidatosNombre = [
    "echeq",
    "e-cheq",
    "cheque electronico",
    "cheque electrónico",
    "cheque digital",
  ];

  // 1) por código exacto (si tu esquema tiene 'codigo')
  const byCode = await FormaPago.findOne({
    where: { codigo: { [Op.in]: candidatosCodigo } },
    transaction: t,
  });
  if (byCode) return byCode.id;

  // 2) por nombre (ilike)
  const byName = await FormaPago.findOne({
    where: {
      [Op.or]: candidatosNombre.map((n) => ({ nombre: { [Op.iLike]: `%${n}%` } })),
    },
    transaction: t,
  });
  return byName ? byName.id : null;
}


/* Aux: deriva imputación desde categoría si no vino */
async function ensureImputacionFromCategoria(categoriaegreso_id, imputacioncontable_id, t) {
  if (imputacioncontable_id) return imputacioncontable_id;
  if (!categoriaegreso_id) return null;
  const cat = await CategoriaEgreso.findByPk(categoriaegreso_id, { transaction: t });
  if (!cat) throw new Error("La categoría indicada no existe");
  if (!cat.imputacioncontable_id) {
    throw new Error("La categoría no tiene imputación contable asociada");
  }
  return cat.imputacioncontable_id;
}

/* =========================
   EGRESOS VARIOS (eCheq)
   ========================= */
export async function registrarEgresoEcheqIndependiente(req, res) {
  const t = await sequelize.transaction();
  try {
    const {
      empresa_id,
      egreso = {},
    } = req.body || {};

    const {
      fecha_emision,
      fecha_vencimiento,
      banco_id,
      proveedor_id,
      importe,
      numero_echeq,
      concepto, // descripción
      observaciones,
      categoriaegreso_id,
      imputacioncontable_id,
      proyecto_id,
    } = egreso;

    if (!empresa_id) throw new Error("empresa_id requerido");
    if (!fecha_emision) throw new Error("fecha_emision requerida");
    if (!fecha_vencimiento) throw new Error("fecha_vencimiento requerida");
    if (!banco_id) throw new Error("banco_id requerido");
    if (!(N(importe) > 0)) throw new Error("importe > 0 requerido");

    const imputacion = await ensureImputacionFromCategoria(categoriaegreso_id, imputacioncontable_id, t);

    const ech = await EcheqEmitido.create({
      empresa_id: toNum(empresa_id),
      proveedor_id: toNum(proveedor_id) || null,
      banco_id: toNum(banco_id),
      fecha_emision,
      fecha_vencimiento,
      importe: N(importe),
      numero_echeq: numero_echeq || null,
      estado: "emitido",
      anulado: false,
      ordenpago_id: null,
      categoriaegreso_id: toNum(categoriaegreso_id) || null,
      imputacioncontable_id: toNum(imputacion) || null,
      proyecto_id: toNum(proyecto_id) || null,
      comprobanteegreso_id: null,
    }, { transaction: t });

    // Nota: NO se crea movimiento bancario aquí; se hará al acreditar.
    await t.commit();
    return res.status(201).json({ ok: true, echeq: ech });
  } catch (e) {
    await t.rollback();
    console.error("registrarEgresoEcheqIndependiente", e);
    return res.status(400).json({ error: e.message || "No se pudo registrar el eCheq" });
  }
}

/* =========================================
   ANTICIPO a Proveedores con eCheq
   Crea OP + abono CtaCte + eCheq emitido
   (el movimiento de banco se genera al 'acreditar')
   ========================================= */
export async function registrarAnticipoProveedorEcheq(req, res) {
  const t = await sequelize.transaction();
  try {
    const {
      empresa_id,
      proveedor_id,
      fecha,               // fecha OP / emisión por defecto
      observaciones,
      pago = {},           // { banco_id, importe, fecha_emision?, fecha_vencimiento?, concepto, categoriaegreso_id, imputacioncontable_id?, proyecto_id?, numero_echeq? }
      idempotencyKey,
    } = req.body || {};

    if (!empresa_id) throw new Error("empresa_id requerido");
    if (!proveedor_id) throw new Error("proveedor_id requerido");
    if (!N(pago.importe)) throw new Error("importe de pago requerido");
    if (!pago.banco_id) throw new Error("banco_id requerido");
    const fechaOP = fecha || pago.fecha_emision || new Date().toISOString().slice(0, 10);
    const fechaEmision = pago.fecha_emision || fechaOP;
    const fechaVto = pago.fecha_vencimiento || fechaEmision;

    // Idempotencia basada en orden de pago
    if (idempotencyKey) {
      const opExistente = await OrdenPago.findOne({
        where: { idempotency_key: idempotencyKey },
        transaction: t,
      });
      if (opExistente) {
        const echeqs = await EcheqEmitido.findAll({ where: { ordenpago_id: opExistente.id }, transaction: t });
        const ctaCte = await MovimientoCtaCteProveedor.findOne({ where: { ordenpago_id: opExistente.id }, transaction: t });
        await t.commit();
        return res.status(200).json({
          ok: true,
          reutilizado: true,
          ordenpago: opExistente,
          echeqs,
          movCtaCte: ctaCte || null,
        });
      }
    }

    // Derivar imputación
    const imputacion = await ensureImputacionFromCategoria(pago.categoriaegreso_id, pago.imputacioncontable_id, t);

    // 1) OP pendiente de aplicación
    const orden = await OrdenPago.create({
      empresa_id: toNum(empresa_id),
      proveedor_id: toNum(proveedor_id),
      comprobanteegreso_id: null,
      fecha: fechaOP,
      total: N(pago.importe),
      estado: "pendiente_aplicacion",
      numero: null,
      observaciones: observaciones || null,
      origen: "anticipo_echeq",
      idempotency_key: idempotencyKey || null,
    }, { transaction: t });

    // 2) eCheq emitido
    const ech = await EcheqEmitido.create({
      empresa_id: toNum(empresa_id),
      proveedor_id: toNum(proveedor_id),
      banco_id: toNum(pago.banco_id),
      fecha_emision: fechaEmision,
      fecha_vencimiento: fechaVto,
      importe: N(pago.importe),
      numero_echeq: pago.numero_echeq || null,
      estado: "emitido",     // luego puede pasar a 'entregado'/'presentado'/'acreditado'
      anulado: false,
      ordenpago_id: orden.id,
      categoriaegreso_id: toNum(pago.categoriaegreso_id) || null,
      imputacioncontable_id: toNum(imputacion) || null,
      proyecto_id: toNum(pago.proyecto_id) || null,
      comprobanteegreso_id: null,
    }, { transaction: t });

    // 3) Cta Cte (ABONO) — el proveedor queda abonado por el anticipo
    const movCtaCte = await MovimientoCtaCteProveedor.create({
      proveedor_id: toNum(proveedor_id),
      empresa_id: toNum(empresa_id),
      fecha: fechaOP,
      descripcion: `Anticipo proveedor Echeq - OP #${orden.id}`,
      tipo: "abono",
      importe: N(pago.importe),
      origen_tipo: "OrdenPago",
      origen_id: orden.id,
      comprobanteegreso_id: null,
      anulado: false,
      ordenpago_id: orden.id,
      // ✅ seteamos la forma de pago (eCheq) si la encontramos
      formapago_id: formaPagoIdECheq || null,
      referencia_tipo: "EcheqEmitido",
      referencia_id: ech.id,
    }, { transaction: t });

    await t.commit();
    return res.status(201).json({
      ok: true,
      mensaje: "Anticipo por eCheq registrado. OP creada y aplicado a Cta Cte.",
      ordenpago: orden,
      echeq: ech,
      movCtaCte,
    });
  } catch (e) {
    await t.rollback();
    console.error("registrarAnticipoProveedorEcheq", e);
    return res.status(400).json({ error: e.message || "No se pudo registrar el anticipo por eCheq" });
  }
}

/* =========================
   ACREDITAR eCheq
   - Crea MovimientoBancoTesoreria (egreso)
   - Cambia estado a 'acreditado'
   ========================= */
export async function acreditarEcheq(req, res) {
  console.log("body", req.body)
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { fecha_acreditacion } = req.body || {};
    const ech = await EcheqEmitido.findByPk(id, { transaction: t });
    if (!ech) throw new Error("eCheq no encontrado");
    if (ech.anulado) throw new Error("El eCheq está anulado");
    if (ech.estado === "acreditado") {
      await t.commit();
      return res.json({ ok: true, mensaje: "eCheq ya estaba acreditado", echeq: ech });
    }

    const fechaMov = fecha_acreditacion || ech.fecha_vencimiento || ech.fecha_emision;

    // Movimiento Banco (egreso)
    const mov = await MovimientoBancoTesoreria.create({
      empresa_id: ech.empresa_id,
      tipo: "egreso",
      descripcion: `Acreditación eCheq #${ech.id}${ech.numero_echeq ? ` (${ech.numero_echeq})` : ""}`,
      monto: N(ech.importe),
      fecha: fechaMov,
      banco_id: ech.banco_id,
      formapago_id: null,
      referencia_id: ech.id,
      referencia_tipo: "EcheqEmitido",
      observaciones: null,
      anulado: false,
      ordenpago_id: ech.ordenpago_id || null,
      categoriaegreso_id: ech.categoriaegreso_id || null,
      imputacioncontable_id: ech.imputacioncontable_id || null,
      proveedor_id: ech.proveedor_id || null,
      idempotency_key: null,
    }, { transaction: t });

    ech.estado = "acreditado";
    await ech.save({ transaction: t });

    await t.commit();
    return res.json({ ok: true, mensaje: "eCheq acreditado", movimientoBanco: mov, echeq: ech });
  } catch (e) {
    await t.rollback();
    console.error("acreditarEcheq", e);
    return res.status(400).json({ error: e.message || "No se pudo acreditar el eCheq" });
  }
}

/* =========================
   RECHAZAR eCheq
   - Cambia estado a 'rechazado'
   - Si hubo OP (anticipo), revierte CtaCte con un CARGO
   ========================= */
export async function rechazarEcheq(req, res) {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { fecha_rechazo, motivo } = req.body || {};
    const ech = await EcheqEmitido.findByPk(id, { transaction: t });
    if (!ech) throw new Error("eCheq no encontrado");
    if (ech.anulado) throw new Error("El eCheq está anulado");

    // Si estaba acreditado, no debería poder 'rechazar' (ya debitado)
    if (ech.estado === "acreditado") {
      throw new Error("No se puede rechazar un eCheq ya acreditado");
    }

    // Reversión CtaCte si hubo OP
    let movCtaCte = null;
    if (ech.ordenpago_id && ech.proveedor_id) {
      const fecha = fecha_rechazo || new Date().toISOString().slice(0, 10);
      movCtaCte = await MovimientoCtaCteProveedor.create({
        proveedor_id: ech.proveedor_id,
        empresa_id: ech.empresa_id,
        fecha,
        descripcion: `Rechazo eCheq emitido - OP #${ech.ordenpago_id}${motivo ? ` (${motivo})` : ""}`,
        tipo: "cargo",
        importe: N(ech.importe),
        origen_tipo: "EcheqEmitido",
        origen_id: ech.id,
        comprobanteegreso_id: null,
        anulado: false,
        ordenpago_id: ech.ordenpago_id,
      }, { transaction: t });
    }

    ech.estado = "rechazado";
    await ech.save({ transaction: t });

    await t.commit();
    return res.json({ ok: true, mensaje: "eCheq rechazado", echeq: ech, movCtaCte });
  } catch (e) {
    await t.rollback();
    console.error("rechazarEcheq", e);
    return res.status(400).json({ error: e.message || "No se pudo rechazar el eCheq" });
  }
}

/* =========================
   ANULAR eCheq
   - Marca anulado=true y estado='anulado'
   - Sin impactos contables adicionales aquí
   ========================= */
export async function anularEcheq(req, res) {
  try {
    const { id } = req.params;
    const ech = await EcheqEmitido.findByPk(id);
    if (!ech) return res.status(404).json({ error: "eCheq no encontrado" });
    if (ech.estado === "acreditado") {
      return res.status(400).json({ error: "No se puede anular un eCheq ya acreditado" });
    }
    ech.anulado = true;
    ech.estado = "anulado";
    await ech.save();
    return res.json({ ok: true, mensaje: "eCheq anulado", echeq: ech });
  } catch (e) {
    console.error("anularEcheq", e);
    return res.status(400).json({ error: e.message || "No se pudo anular el eCheq" });
  }
}

/* =========================
   LISTADO / CRUD BÁSICO
   ========================= */
export async function listarEcheqsEmitidos(req, res) {
  try {
    const {
      empresa_id,
      banco_id,
      estado,                 // emitido|entregado|presentado|acreditado|rechazado|anulado
      fecha_desde,
      fecha_hasta,
      por = "emision",        // "emision" | "vencimiento"
      numero_echeq,
      includeAnulados = "0",
    } = req.query;

    const where = {};
    if (empresa_id) where.empresa_id = Number(empresa_id);
    if (banco_id) where.banco_id = Number(banco_id);
    if (estado) where.estado = String(estado).toLowerCase();
    if (numero_echeq) where.numero_echeq = { [Op.iLike]: `%${numero_echeq}%` };

    if (includeAnulados !== "1") where.anulado = false;

    // Rango de fechas
    if (fecha_desde || fecha_hasta) {
      const field = por === "vencimiento" ? "fecha_vencimiento" : "fecha_emision";
      where[field] = {};
      if (fecha_desde) where[field][Op.gte] = fecha_desde;
      if (fecha_hasta) where[field][Op.lte] = fecha_hasta;
    }

    const list = await EcheqEmitido.findAll({
      where,
      order: [
        [por === "vencimiento" ? "fecha_vencimiento" : "fecha_emision", "ASC"],
        ["id", "ASC"],
      ],
    });

    return res.json(list);
  } catch (e) {
    console.error("listarEcheqsEmitidos", e);
    return res.status(500).json({ error: "Error al listar eCheqs emitidos" });
  }
}

export async function obtenerEcheqEmitidoPorId(req, res) {
  try {
    const ech = await EcheqEmitido.findByPk(req.params.id);
    if (!ech) return res.status(404).json({ error: "eCheq no encontrado" });
    return res.json(ech);
  } catch (e) {
    console.error("obtenerEcheqEmitidoPorId", e);
    return res.status(500).json({ error: "Error al obtener eCheq" });
  }
}

export async function actualizarEcheqEmitido(req, res) {
  try {
    const ech = await EcheqEmitido.findByPk(req.params.id);
    if (!ech) return res.status(404).json({ error: "eCheq no encontrado" });

    // Si actualizan categoría y no mandan imputación, derivarla
    if (req.body?.categoriaegreso_id && !req.body?.imputacioncontable_id) {
      const imp = await ensureImputacionFromCategoria(req.body.categoriaegreso_id, null, null);
      req.body.imputacioncontable_id = imp;
    }

    await ech.update(req.body);
    return res.json(ech);
  } catch (e) {
    console.error("actualizarEcheqEmitido", e);
    return res.status(500).json({ error: "Error al actualizar eCheq" });
  }
}

export async function eliminarEcheqEmitido(req, res) {
  try {
    const ech = await EcheqEmitido.findByPk(req.params.id);
    if (!ech) return res.status(404).json({ error: "eCheq no encontrado" });
    await ech.destroy();
    return res.json({ ok: true, mensaje: "eCheq eliminado" });
  } catch (e) {
    console.error("eliminarEcheqEmitido", e);
    return res.status(500).json({ error: "Error al eliminar eCheq" });
  }
}
