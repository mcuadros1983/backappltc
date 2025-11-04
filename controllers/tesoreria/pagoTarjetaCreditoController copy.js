// controllers/tesoreria/pagosTarjetaController.js
import { Op } from "sequelize";
import { sequelize } from "../../config/database.js";
import TarjetaComun from "../../models/comun/tarjetacomun.js";
import PagoTarjetaCredito from "../../models/tesoreria/pagotarjetacredito.js";
import MovimientoCtaCteProveedor from "../../models/tesoreria/movimientoctacteproveedor.js";
import CategoriaEgreso from "../../models/tesoreria/categoriaEgreso.js";
import OrdenPago from "../../models/tesoreria/ordendepago.js";

const toNum = (v) => (v === null || v === undefined || v === "" ? null : Number(v));

async function findTarjetaOrThrow({ tarjetacomun_id, empresa_id, transaction }) {
  const tc = await TarjetaComun.findOne({
    where: { id: tarjetacomun_id, empresa_id },
    transaction,
  });
  if (!tc) throw new Error("Tarjeta no encontrada para la empresa indicada");
  return tc;
}
/* ========= Altas específicas ========= */

// EGRESOS VARIOS con Tarjeta (no OP)
export async function registrarEgresoTarjetaIndependiente(req, res) {
  try {
    console.log("ingreso pago...")
    const { empresa_id, egreso } = req.body || {};
    if (!empresa_id) return res.status(400).json({ error: "empresa_id requerido" });
    if (!egreso) return res.status(400).json({ error: "Objeto egreso requerido" });

    const {
      fecha,
      tarjetacomun_id,
      importe,
      proveedor_id,
      proyecto_id,
      categoriaegreso_id,
      imputacioncontable_id,
      concepto,
      observaciones,
      cupon_numero,
      planpago_id,
    } = egreso;

    if (!fecha) return res.status(400).json({ error: "fecha requerida" });
    if (!importe || Number(importe) <= 0) return res.status(400).json({ error: "importe > 0 requerido" });
    if (!tarjetacomun_id) return res.status(400).json({ error: "tarjetacomun_id requerido" });

    const tarjeta = await findTarjetaOrThrow({ tarjetacomun_id, empresa_id });

    const pago = await PagoTarjetaCredito.create({
      empresa_id: toNum(empresa_id),
      fecha,
      importe: Number(importe),
      proveedor_id: toNum(proveedor_id),
      concepto: concepto?.trim() || null,
      observaciones: observaciones?.trim() || null,
      cupon_numero: cupon_numero || null,
      planpago_id: toNum(planpago_id) || null,
      // vínculo con tarjeta
      tarjetacomun_id: tarjeta.id,
      tipotarjeta_id: tarjeta.tipotarjeta_id,
      marcatarjeta_id: tarjeta.marca_id,
      // estado inicial
      estado: "pendiente",
      // (opcional) campos de “clasificación” que usas en UI:
      categoriaegreso_id: toNum(categoriaegreso_id) || null,
      imputacioncontable_id: toNum(imputacioncontable_id) || null,
      proyecto_id: toNum(proyecto_id) || null,
    });

    return res.json(pago);
  } catch (e) {
    console.error("registrarEgresoTarjetaIndependiente", e);
    return res.status(500).json({ error: e.message || "Error interno" });
  }
}

// ANTICIPO a Proveedores con Tarjeta — crea OP + pagos + movimiento en CtaCte
export async function registrarAnticipoProveedorTarjeta(req, res) {
  const t = await sequelize.transaction();
  try {
    const {
      empresa_id,
      proveedor_id,
      fecha,                // opcional (si no viene, se toma de primer pago o hoy)
      observaciones,
      pagos = [],           // [{ tarjetacomun_id, monto, detalle, categoriaegreso_id, imputacioncontable_id?, proyecto_id?, cupon_numero?, planpago_id?, fecha? }]
      idempotencyKey,
    } = req.body || {};

    if (!empresa_id) throw new Error("empresa_id requerido");
    if (!proveedor_id) throw new Error("proveedor_id requerido");
    if (!Array.isArray(pagos) || pagos.length === 0) throw new Error("Debe enviar al menos un pago");

    // Validar pagos y derivar imputación desde categoría si falta
    let total = 0;
    for (const p of pagos) {
      if (!p.tarjetacomun_id) throw new Error("tarjetacomun_id requerido en cada pago");
      const monto = Number(p.monto);
      if (!(monto > 0)) throw new Error("monto > 0 requerido en cada pago");

      // tarjeta debe existir y pertenecer a la empresa
      await findTarjetaOrThrow({ tarjetacomun_id: p.tarjetacomun_id, empresa_id, transaction: t });

      // imputación contable (si no viene, derivar por categoría)
      if (!p.imputacioncontable_id) {
        if (!p.categoriaegreso_id) throw new Error("categoriaegreso_id requerido en pagos");
        const cat = await CategoriaEgreso.findByPk(p.categoriaegreso_id, { transaction: t });
        if (!cat) throw new Error("La categoría indicada no existe");
        if (!cat.imputacioncontable_id) throw new Error("La categoría no tiene imputación contable asociada");
        p.imputacioncontable_id = cat.imputacioncontable_id;
      }
      total += monto;
    }
    if (!(total > 0)) throw new Error("Importe total inválido");

    // Idempotencia por OP (si ya existe, devolvemos lo existente)
    if (idempotencyKey) {
      const opExistente = await OrdenPago.findOne({
        where: { idempotency_key: idempotencyKey },
        transaction: t,
      });
      if (opExistente) {
        const pagosExist = await PagoTarjetaCredito.findAll({
          where: { ordenpago_id: opExistente.id },
          transaction: t,
        });
        const ctaCte = await MovimientoCtaCteProveedor.findOne({
          where: { ordenpago_id: opExistente.id },
          transaction: t,
        });
        await t.commit();
        return res.status(200).json({
          ok: true,
          reutilizado: true,
          ordenpago: opExistente,
          pagosTarjeta: pagosExist,
          movCtaCte: ctaCte || null,
        });
      }
    }

    const hoy = new Date().toISOString().slice(0, 10);
    const fechaOP = fecha || pagos.find((p) => p.fecha)?.fecha || hoy;

    // 1) Crear Orden de Pago (pendiente de aplicación)
    const orden = await OrdenPago.create(
      {
        empresa_id,
        proveedor_id,
        comprobanteegreso_id: null,
        fecha: fechaOP,
        total,
        estado: "pendiente_aplicacion",
        numero: null,
        observaciones: observaciones || null,
        origen: "anticipo_tarjeta",
        idempotency_key: idempotencyKey || null,
      },
      { transaction: t }
    );

    // 2) Crear Pagos con Tarjeta (uno por item)
    const pagosInsertados = [];
    for (const p of pagos) {
      const tarjeta = await findTarjetaOrThrow({
        tarjetacomun_id: p.tarjetacomun_id,
        empresa_id,
        transaction: t,
      });

      const fechaPago = p.fecha || fechaOP;
      const pago = await PagoTarjetaCredito.create(
        {
          empresa_id: toNum(empresa_id),
          proveedor_id: toNum(proveedor_id),
          fecha: fechaPago,
          importe: Number(p.monto),
          concepto: (p.detalle || "Anticipo a proveedor").trim(),
          observaciones: observaciones?.trim() || null,
          cupon_numero: p.cupon_numero || null,
          planpago_id: toNum(p.planpago_id) || null,
          tarjetacomun_id: tarjeta.id,
          tipotarjeta_id: tarjeta.tipotarjeta_id,
          marcatarjeta_id: tarjeta.marca_id,
          estado: "pendiente",
          categoriaegreso_id: toNum(p.categoriaegreso_id),
          imputacioncontable_id: toNum(p.imputacioncontable_id),
          proyecto_id: toNum(p.proyecto_id) || null,
          comprobanteegreso_id: null,
          anulado: false,
          ordenpago_id: orden.id,
        },
        { transaction: t }
      );
      pagosInsertados.push(pago);
    }

    // 3) Movimiento en Cuenta Corriente (ABONO)
    const movCtaCte = await MovimientoCtaCteProveedor.create(
      {
        proveedor_id,
        empresa_id,
        fecha: fechaOP,
        descripcion: `Anticipo proveedor con Tarjeta - OP #${orden.id}`,
        tipo: "abono",
        importe: total,
        origen_tipo: "OrdenPago",
        origen_id: orden.id,
        comprobanteegreso_id: null,
        anulado: false,
        ordenpago_id: orden.id,
      },
      { transaction: t }
    );

    await t.commit();
    return res.status(201).json({
      ok: true,
      mensaje: "Anticipo con tarjeta registrado. OP creada y aplicado a Cta Cte.",
      ordenpago: orden,
      pagosTarjeta: pagosInsertados,
      movCtaCte,
    });
  } catch (error) {
    await t.rollback();
    console.error("❌ registrarAnticipoProveedorTarjeta:", error);
    return res.status(400).json({ error: error.message || "No se pudo registrar el anticipo con tarjeta" });
  }
};



/* ========= CRUD / Listado ========= */

export async function crearPagoTarjeta(req, res) {
  try {
    const body = req.body || {};
    if (!body.empresa_id) return res.status(400).json({ error: "empresa_id requerido" });
    if (!body.fecha) return res.status(400).json({ error: "fecha requerida" });
    if (!body.importe || Number(body.importe) <= 0) return res.status(400).json({ error: "importe > 0 requerido" });

    // Si viene tarjetacomun_id, validarlo y completar tipo/marca
    if (body.tarjetacomun_id) {
      const t = await findTarjetaOrThrow({ tarjetacomun_id: body.tarjetacomun_id, empresa_id: body.empresa_id });
      body.tipotarjeta_id = t.tipotarjeta_id;
      body.marcatarjeta_id = t.marca_id;
    }

    const pago = await PagoTarjetaCredito.create(body);
    return res.json(pago);
  } catch (e) {
    console.error("crearPagoTarjeta", e);
    return res.status(500).json({ error: e.message || "Error interno" });
  }
}

export async function listarPagosTarjeta(req, res) {
  try {
    const {
      empresa_id,
      fecha_desde,
      fecha_hasta,
      terminacion,      // 🔎 filtro por terminación de TarjetaComun
      tarjeta_id,       // tarjetacomun_id específico
      estado,
      includeAnulados,
    } = req.query || {};

    const where = {};
    if (empresa_id) where.empresa_id = toNum(empresa_id);
    if (estado) where.estado = estado;
    if (!includeAnulados) where.anulado = false;
    if (fecha_desde || fecha_hasta) {
      where.fecha = {};
      if (fecha_desde) where.fecha[Op.gte] = fecha_desde;
      if (fecha_hasta) where.fecha[Op.lte] = fecha_hasta;
    }
    if (tarjeta_id) where.tarjetacomun_id = toNum(tarjeta_id);

    const include = [];
    if (terminacion || tarjeta_id) {
      include.push({
        model: TarjetaComun,
        as: "tarjeta",
        required: !!(terminacion || tarjeta_id),
        where: {
          ...(terminacion ? { terminacion: String(terminacion).padStart(4, "0") } : {}),
          ...(empresa_id ? { empresa_id: toNum(empresa_id) } : {}),
        },
        attributes: ["id", "terminacion", "tipotarjeta_id", "marca_id", "banco_id"],
      });
    }

    const rows = await PagoTarjetaCredito.findAll({
      where,
      include,
      order: [["fecha", "ASC"], ["id", "ASC"]],
    });

    return res.json(rows);
  } catch (e) {
    console.error("listarPagosTarjeta", e);
    return res.status(500).json({ error: e.message || "Error interno" });
  }
}

export async function obtenerPagoTarjeta(req, res) {
  try {
    const { id } = req.params;
    const row = await PagoTarjetaCredito.findByPk(id, {
      include: [{ model: TarjetaComun, as: "tarjeta" }],
    });
    if (!row) return res.status(404).json({ error: "No encontrado" });
    return res.json(row);
  } catch (e) {
    console.error("obtenerPagoTarjeta", e);
    return res.status(500).json({ error: e.message || "Error interno" });
  }
}

export async function actualizarPagoTarjeta(req, res) {
  try {
    const { id } = req.params;
    const body = req.body || {};
    const row = await PagoTarjetaCredito.findByPk(id);
    if (!row) return res.status(404).json({ error: "No encontrado" });

    // si cambian la tarjeta, validar y completar
    if (body.tarjetacomun_id) {
      const t = await findTarjetaOrThrow({ tarjetacomun_id: body.tarjetacomun_id, empresa_id: body.empresa_id || row.empresa_id });
      body.tipotarjeta_id = t.tipotarjeta_id;
      body.marcatarjeta_id = t.marca_id;
    }

    await row.update(body);
    return res.json(row);
  } catch (e) {
    console.error("actualizarPagoTarjeta", e);
    return res.status(500).json({ error: e.message || "Error interno" });
  }
}

export async function eliminarPagoTarjeta(req, res) {
  try {
    const { id } = req.params;
    const row = await PagoTarjetaCredito.findByPk(id);
    if (!row) return res.status(404).json({ error: "No encontrado" });
    await row.update({ anulado: true });
    return res.json({ ok: true });
  } catch (e) {
    console.error("eliminarPagoTarjeta", e);
    return res.status(500).json({ error: e.message || "Error interno" });
  }
}

/* ========= Utilidades ========= */
export async function listarTarjetasPorEmpresa(req, res) {
  try {
    const { empresa_id, terminacion } = req.query || {};
    const where = {};
    if (empresa_id) where.empresa_id = toNum(empresa_id);
    if (terminacion) where.terminacion = String(terminacion).padStart(4, "0");

    const rows = await TarjetaComun.findAll({
      where,
      order: [["terminacion", "ASC"], ["id", "ASC"]],
    });
    return res.json(rows);
  } catch (e) {
    console.error("listarTarjetasPorEmpresa", e);
    return res.status(500).json({ error: e.message || "Error interno" });
  }
}
