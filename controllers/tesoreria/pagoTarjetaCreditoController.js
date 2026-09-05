// controllers/tesoreria/pagoTarjetaCreditoController.js
import { Op } from "sequelize";
import { sequelize } from "../../config/database.js";

import TarjetaComun from "../../models/comun/tarjetacomun.js";
import PagoTarjetaCredito from "../../models/tesoreria/pagotarjetacredito.js";
import MovimientoCtaCteProveedor from "../../models/tesoreria/movimientoctacteproveedor.js";
import MovimientoCtaCteProveedorAplic from "../../models/tesoreria/movimientoctacteproveedoraplicacion.js";
import CategoriaEgreso from "../../models/tesoreria/categoriaEgreso.js";
import OrdenPago from "../../models/tesoreria/ordendepago.js";
import ComprobanteEgreso from "../../models/iva/comprobanteegreso.js";
import MovimientoCajaTesoreria from "../../models/tesoreria/movimientocajatesoreria.js";
import MovimientoBancoTesoreria from "../../models/tesoreria/movimientobancotesoreria.js";
import FormaPago from "../../models/comun/formapagotesoreria.js"
import FormaPagoTesoreria from "../../models/comun/formapagotesoreria.js";
import EcheqEmitido from "../../models/tesoreria/pagoecheq.js";
const toNum = (v) => (v === null || v === undefined || v === "" ? null : Number(v));

async function findTarjetaOrThrow({ tarjetacomun_id, empresa_id, transaction }) {
  const tc = await TarjetaComun.findOne({
    where: { id: tarjetacomun_id, empresa_id },
    transaction,
  });
  if (!tc) throw new Error("Tarjeta no encontrada para la empresa indicada");
  return tc;
}


/** 
 * 🔧 Resuelve el id de la Forma de Pago "Tarjeta".
 * Intenta por 'codigo' y luego por 'nombre' (case-insensitive).
 * Ajustá los campos si tu modelo usa otros.
 */
async function resolveFormaPagoIdTarjeta(t) {
  // 1) por código estable si tu catálogo lo tiene (recomendado)
  let fp = await FormaPago.findOne({
    where: { descripcion: { [Op.in]: ["tarjeta", "tarjeta_credito", "tc"] } },
    transaction: t,
  });

  // 2) fallback: por nombre (evita acentos, usa ILIKE en PG)
  if (!fp) {
    fp = await FormaPago.findOne({
      where: {
        descripcion: { [Op.iLike]: "%tarjeta%" },
      },
      transaction: t,
    });
  }

  if (!fp) {
    console.warn("⚠️ FormaPago TARJETA no encontrada. Dejaré formapago_id en null.");
    return null;
  }

  return fp.id;
}

/* ========= Altas específicas ========= */

// EGRESOS VARIOS con Tarjeta (sin OP)
export async function registrarEgresoTarjetaIndependiente(req, res) {
  try {
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
      // clasificación opcional
      categoriaegreso_id: toNum(categoriaegreso_id) || null,
      imputacioncontable_id: toNum(imputacioncontable_id) || null,
      proyecto_id: toNum(proyecto_id) || null,
      // sin OP / sin comprobante
      ordenpago_id: null,
      comprobanteegreso_id: null,
      referencia_tipo: null,
      referencia_id: null,
      anulado: false,
    });

    return res.json(pago);
  } catch (e) {
    console.error("registrarEgresoTarjetaIndependiente", e);
    return res.status(500).json({ error: e.message || "Error interno" });
  }
}

// ANTICIPO a Proveedores con Tarjeta — crea OP + pagos + ABONO cta cte (referenciado a pago si es único)
export async function registrarAnticipoProveedorTarjeta(req, res) {
  console.log("req.body creacion", req.body)
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

      await findTarjetaOrThrow({ tarjetacomun_id: p.tarjetacomun_id, empresa_id, transaction: t });

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

    // Idempotencia por OP
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

    // 🔎 resolver UNA VEZ el formapago_id para TARJETA
    const formaPagoTarjetaId = await resolveFormaPagoIdTarjeta(t);

    // 1) Crear Orden de Pago (pendiente de aplicación)
    const orden = await OrdenPago.create(
      {
        empresa_id,
        proveedor_id,
        comprobanteegreso_id: null,
        fecha: fechaOP,
        fecha_pago: fechaOP,
        total,
        estado: "pendiente_aplicacion",
        numero: null,
        observaciones: observaciones || null,
        origen: "anticipo_tarjeta",
        idempotency_key: idempotencyKey || null,
      },
      { transaction: t }
    );

    // 2) Crear Pagos con Tarjeta
    const pagosInsertados = [];
    for (let i = 0; i < pagos.length; i++) {
      const p = pagos[i];
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
          // referencia a la OP por claridad
          referencia_tipo: "OrdenPago",
          referencia_id: orden.id,
        },
        { transaction: t }
      );
      pagosInsertados.push(pago);
    }

    // 3) Movimiento en Cuenta Corriente (ABONO) — referenciado al pago si es único
    let refTipo = null, refId = null;
    if (pagosInsertados.length === 1) {
      refTipo = "PagoTarjetaCredito";
      refId = pagosInsertados[0].id;
    }

    const movCtaCte = await MovimientoCtaCteProveedor.create(
      {
        proveedor_id,
        empresa_id,
        fecha: fechaOP,
        fecha_pago: fechaOP,
        descripcion: `Anticipo proveedor con Tarjeta - OP #${orden.id}`,
        tipo: "abono",
        importe: total,
        origen_tipo: "OrdenPago",
        origen_id: orden.id,
        comprobanteegreso_id: null,
        anulado: false,
        ordenpago_id: orden.id,
        // 👇 referencia al medio de pago si hay uno único (consistente con caja/banco)
        referencia_tipo: refTipo,
        referencia_id: refId,
        formapago_id: formaPagoTarjetaId,
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
}

/* ========= CRUD / Listado ========= */

export async function crearPagoTarjeta(req, res) {
  try {
    const body = req.body || {};
    if (!body.empresa_id) return res.status(400).json({ error: "empresa_id requerido" });
    if (!body.fecha) return res.status(400).json({ error: "fecha requerida" });
    if (!body.importe || Number(body.importe) <= 0) return res.status(400).json({ error: "importe > 0 requerido" });

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
      terminacion,
      tarjeta_id,
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

/**
 * Eliminación “real” de pago con tarjeta:
 * - si está ligado a OP de anticipo_tarjeta: baja pago, busca y ajusta/elimina el ABONO,
 *   elimina aplicaciones (mov_ctacte_proveedor_aplic), recalcula comprobantes, ajusta/elimina OP.
 * - si no tiene OP ni ABONO relacionado: borra el registro o márcalo anulado (a elección).
 */
export async function eliminarPagoTarjeta(req, res) {
  const t = await sequelize.transaction();
  try {
    // === Helper: recalcular saldo/estado de un ComprobanteEgreso ===
    async function recalcComprobanteEgreso(compId, trx) {
      const EPS_REC = 0.0001;
      const comp = await ComprobanteEgreso.findByPk(compId, { transaction: trx });
      if (!comp) return;
      const totalComp =
        Number(comp.montoreal || 0) > 0
          ? Number(comp.montoreal)
          : Number(comp.total || 0);

      const [cajaComp, bancoComp, tarjetaComp, echeqComp] = await Promise.all([

        MovimientoCajaTesoreria.findAll({
          where: {
            comprobanteegreso_id: compId,
            [Op.or]: [
              { anulado: false },
              { anulado: null },
            ],
          },
          transaction: trx,
        }),

        MovimientoBancoTesoreria.findAll({
          where: {
            comprobanteegreso_id: compId,
            [Op.or]: [
              { anulado: false },
              { anulado: null },
            ],
          },
          transaction: trx,
        }),

        PagoTarjetaCredito.findAll({
          where: {
            comprobanteegreso_id: compId,
            anulado: false,
            estado: {
              [Op.notIn]: [
                "rechazado",
              ],
            },
          },
          transaction: trx,
        }),

        EcheqEmitido.findAll({
          where: {
            comprobanteegreso_id: compId,
            anulado: false,
            estado: {
              [Op.notIn]: [
                "anulado",
                "rechazado",
              ],
            },
          },
          transaction: trx,
        }),
      ]);

      const pagosDirectos =
        (cajaComp || []).reduce((a, r) => a + Number(r.monto || 0), 0) +
        (bancoComp || []).reduce((a, r) => a + Number(r.monto || 0), 0) +
        (tarjetaComp || []).reduce((a, r) => a + Number(r.importe || 0), 0) +
        (echeqComp || []).reduce((a, r) => a + Number(r.importe || 0), 0);

      const cargosComp = await MovimientoCtaCteProveedor.findAll({
        where: {
          comprobanteegreso_id: compId,
          tipo: "cargo",
          [Op.or]: [
            { anulado: false },
            { anulado: null },
          ],
        },
        attributes: ["id"],
        transaction: trx,
      });
      const cargoIds = cargosComp.map(c => c.id);

      let aplicadoAbonos = 0;
      if (cargoIds.length) {
        const applsRest = await MovimientoCtaCteProveedorAplic.findAll({
          where: { cargo_id: { [Op.in]: cargoIds } },
          attributes: ["importe"],
          transaction: trx,
        });
        aplicadoAbonos = (applsRest || []).reduce((acc, a) => acc + Number(a.importe || 0), 0);
      }

      const pagadoReal = pagosDirectos + aplicadoAbonos;
      const saldo = Math.max(0, Number((totalComp - pagadoReal).toFixed(2)));

      let estadoComp = "impaga";
      if (Math.abs(saldo) <= EPS_REC) estadoComp = "pagada";
      else if (pagadoReal > EPS_REC && saldo > EPS_REC) estadoComp = "parcial";

      const patch = { saldo };
      if (Object.prototype.hasOwnProperty.call(comp.dataValues, "estadopago")) patch.estadopago = estadoComp;
      if (Object.prototype.hasOwnProperty.call(comp.dataValues, "estado")) patch.estado = estadoComp;

      await comp.update(patch, { transaction: trx });
      console.log("[recalcComprobanteEgreso/tarjeta]", { compId, totalComp, pagosDirectos, aplicadoAbonos, saldo, estadoComp });
    }

    async function actualizarFormaPagoActualComprobante(compId, trx) {

      const comp = await ComprobanteEgreso.findByPk(
        compId,
        {
          transaction: trx,
          lock: trx.LOCK.UPDATE,
        }
      );

      if (!comp) return;

      const [
        movimientosCaja,
        movimientosBanco,
        echeqs,
        tarjetas,
        cargosCtaCte,
      ] = await Promise.all([

        MovimientoCajaTesoreria.findAll({
          where: {
            comprobanteegreso_id: compId,
            [Op.or]: [
              { anulado: false },
              { anulado: null },
            ],
          },
          attributes: ["id", "formapago_id"],
          transaction: trx,
        }),

        MovimientoBancoTesoreria.findAll({
          where: {
            comprobanteegreso_id: compId,
            [Op.or]: [
              { anulado: false },
              { anulado: null },
            ],
          },
          attributes: ["id", "formapago_id"],
          transaction: trx,
        }),

        EcheqEmitido.findAll({
          where: {
            comprobanteegreso_id: compId,
            anulado: false,
            estado: {
              [Op.notIn]: [
                "anulado",
                "rechazado",
              ],
            },
          },
          attributes: ["id"],
          transaction: trx,
        }),

        PagoTarjetaCredito.findAll({
          where: {
            comprobanteegreso_id: compId,
            anulado: false,
            estado: {
              [Op.notIn]: [
                "rechazado",
              ],
            },
          },
          attributes: ["id"],
          transaction: trx,
        }),

        MovimientoCtaCteProveedor.findAll({
          where: {
            comprobanteegreso_id: compId,
            tipo: "cargo",
            [Op.or]: [
              { anulado: false },
              { anulado: null },
            ],
          },
          attributes: ["id"],
          transaction: trx,
        }),
      ]);

      const formasCatalogo =
        await FormaPagoTesoreria.findAll({ 
          transaction: trx,
        });

      const buscarFormaPorDescripcion = (descripcion) => {

        const buscada =
          String(descripcion || "")
            .trim()
            .toUpperCase();

        return formasCatalogo.find(
          fp =>
            String(fp.descripcion || "")
              .trim()
              .toUpperCase() === buscada
        ) || null;
      };

      const formaEcheq =
        buscarFormaPorDescripcion("ECHEQ");

      const formaTarjetaCredito =
        buscarFormaPorDescripcion(
          "TARJETA CREDITO"
        );

      const formaCtaCte =
        buscarFormaPorDescripcion(
          "CTA CTE"
        );

      const formasPagoActuales =
        new Set();

      const agregarFormaRegistrada = (registros) => {

        for (const registro of registros || []) {

          const formaPagoId =
            Number(
              registro.formapago_id || 0
            );

          if (formaPagoId) {
            formasPagoActuales.add(
              formaPagoId
            );
          }
        }
      };

      agregarFormaRegistrada(
        movimientosCaja
      );

      agregarFormaRegistrada(
        movimientosBanco
      );

      if (echeqs.length > 0) {

        if (!formaEcheq) {
          throw new Error(
            'No se encontró la forma de pago "ECHEQ".'
          );
        }

        formasPagoActuales.add(
          Number(formaEcheq.id)
        );
      }

      if (tarjetas.length > 0) {

        if (!formaTarjetaCredito) {
          throw new Error(
            'No se encontró la forma de pago "TARJETA CREDITO".'
          );
        }

        formasPagoActuales.add(
          Number(formaTarjetaCredito.id)
        );
      }

      if (cargosCtaCte.length > 0) {

        if (!formaCtaCte) {
          throw new Error(
            'No se encontró la forma de pago "CTA CTE".'
          );
        }

        formasPagoActuales.add(
          Number(formaCtaCte.id)
        );
      }

      const idsFormas =
        [...formasPagoActuales];

      const nuevaFormaPagoId =
        idsFormas.length === 1
          ? idsFormas[0]
          : null;

      await comp.update(
        {
          formapago_id:
            nuevaFormaPagoId,
        },
        {
          transaction: trx,
        }
      );
    }

    // === Cuerpo principal ===
    const { id } = req.params;
    const pago = await PagoTarjetaCredito.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!pago) {
      await t.rollback();
      return res.status(404).json({ error: "No encontrado" });
    }

    const EPS = 0.0001;
    const montoPago = Number(pago.importe || 0);
    const compIdDirecto = Number(pago.comprobanteegreso_id || 0) || null;

    // Traer OP si existe (para ajustar/destruir más abajo)
    const orden = pago.ordenpago_id
      ? await OrdenPago.findByPk(pago.ordenpago_id, { transaction: t, lock: t.LOCK.UPDATE })
      : null;

    // ===== 1) Buscar ABONOS vinculados =====
    // (a) Abono que referencia directamente a este PagoTarjetaCredito
    const abonoRef = await MovimientoCtaCteProveedor.findOne({
      where: {
        referencia_tipo: "PagoTarjetaCredito",
        referencia_id: pago.id,
        tipo: "abono",
        anulado: { [Op.not]: true },
      },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    // (b) Abonos por la misma OP (pueden ser varios)
    const abonosViaOP = pago.ordenpago_id
      ? await MovimientoCtaCteProveedor.findAll({
        where: { ordenpago_id: pago.ordenpago_id, tipo: "abono", anulado: { [Op.not]: true } },
        transaction: t,
        lock: t.LOCK.UPDATE,
      })
      : [];

    // Set para acumular comprobantes a recalcular
    const compIdsAfectados = new Set();
    if (compIdDirecto) compIdsAfectados.add(compIdDirecto);

    /*
   * Parte del pago que todavía debe restaurarse
   * como deuda en Cuenta Corriente.
   */
    let importeCargoPendiente =
      Number(montoPago || 0);

    let debeCrearCargo =
      importeCargoPendiente > EPS;

    // ===== 2) Si hay ABONO DIRECTO: eliminar aplicaciones y ajustar/eliminar el ABONO =====
    if (abonoRef) {
      // recolecto comp del propio abono
      const compFromAbono = Number(abonoRef.comprobanteegreso_id || 0);
      if (compFromAbono) compIdsAfectados.add(compFromAbono);

      const appls = await MovimientoCtaCteProveedorAplic.findAll({
        where: { abono_id: abonoRef.id },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      if (appls.length) {
        const cargoIds = [...new Set(appls.map(a => Number(a.cargo_id)).filter(Boolean))];
        if (cargoIds.length) {
          const cargos = await MovimientoCtaCteProveedor.findAll({
            where: { id: { [Op.in]: cargoIds } },
            attributes: ["id", "comprobanteegreso_id"],
            transaction: t,
          });
          for (const cg of cargos) {
            const cid = Number(cg.comprobanteegreso_id || 0);
            if (cid) compIdsAfectados.add(cid);
          }
        }
        await MovimientoCtaCteProveedorAplic.destroy({ where: { abono_id: abonoRef.id }, transaction: t });
      }

      // Ajuste/eliminación del abono (resto el monto del pago que estoy borrando)
      const nuevoImporteAbono = Math.max(0, Number((Number(abonoRef.importe || 0) - montoPago).toFixed(2)));
      if (nuevoImporteAbono <= EPS) {
        await abonoRef.destroy({ transaction: t });
      } else {
        await abonoRef.update({ importe: nuevoImporteAbono }, { transaction: t });
      }

      /*
 * El abono directo ya representaba este pago.
 * Al revertirlo no necesitamos crear además
 * una nueva deuda por el mismo importe.
 */
      importeCargoPendiente = 0;
      debeCrearCargo = false;
    }

    // ===== 2.bis) Si NO hubo abono directo pero SÍ abonos vía OP:
    // limpiar aplicaciones y reducir/destruir esos abonos repartiendo el monto del pago
    if (!abonoRef && abonosViaOP.length > 0) {
      let restante = montoPago;

      // ordeno por id (o fecha) para tener determinismo
      abonosViaOP.sort((a, b) => Number(a.id) - Number(b.id));

      for (const ab of abonosViaOP) {
        // recolecto comp del propio abono
        const compFromAbono = Number(ab.comprobanteegreso_id || 0);
        if (compFromAbono) compIdsAfectados.add(compFromAbono);

        // limpiar aplicaciones y recolectar comprobantes por cargos
        const appls = await MovimientoCtaCteProveedorAplic.findAll({
          where: { abono_id: ab.id },
          transaction: t,
          lock: t.LOCK.UPDATE,
        });
        if (appls.length) {
          const cargoIds = [...new Set(appls.map(a => Number(a.cargo_id)).filter(Boolean))];
          if (cargoIds.length) {
            const cargos = await MovimientoCtaCteProveedor.findAll({
              where: { id: { [Op.in]: cargoIds } },
              attributes: ["id", "comprobanteegreso_id"],
              transaction: t,
            });
            for (const cg of cargos) {
              const cid = Number(cg.comprobanteegreso_id || 0);
              if (cid) compIdsAfectados.add(cid);
            }
          }
          await MovimientoCtaCteProveedorAplic.destroy({ where: { abono_id: ab.id }, transaction: t });
        }

        if (restante <= EPS) break;

        const imp = Number(ab.importe || 0);
        if (imp <= restante + EPS) {
          // este abono se va entero
          restante = Math.max(0, Number((restante - imp).toFixed(2)));
          await ab.destroy({ transaction: t });
        } else {
          // se reduce parcialmente
          const nuevoImporte = Math.max(0, Number((imp - restante).toFixed(2)));
          restante = 0;
          if (nuevoImporte <= EPS) {
            await ab.destroy({ transaction: t });
          } else {
            await ab.update({ importe: nuevoImporte }, { transaction: t });
          }
          break;
        }
      }
      /*
       * Lo que los abonos vía OP no pudieron absorber
       * deberá restaurarse como nueva deuda.
       */
      importeCargoPendiente =
        Math.max(
          0,
          Number(restante.toFixed(2))
        );

      debeCrearCargo =
        importeCargoPendiente > EPS;
    }

    // ===== 3) Eliminar el PAGO TARJETA =====
    await pago.destroy({ transaction: t });

    // 3.bis) (CONDICIONAL) Generar CARGO por reversión SOLO si NO hubo abono DIRECTO
    if (debeCrearCargo && compIdDirecto) {
      const comp = await ComprobanteEgreso.findByPk(compIdDirecto, { transaction: t, lock: t.LOCK.UPDATE });
      if (comp) {
        const descCtaCte = `Reversión pago con tarjeta de comp. ${comp.nrocomprobante ?? comp.id}`;
        const fechaCtaCte = pago.fecha || comp.fechacomprobante || new Date().toISOString().slice(0, 10);

        await MovimientoCtaCteProveedor.create(
          {
            proveedor_id: comp.proveedor_id || pago.proveedor_id || null,
            empresa_id: comp.empresa_id || pago.empresa_id || null,
            fecha: fechaCtaCte,
            fecha_pago: null,
            descripcion: descCtaCte,
            tipo: "cargo",
            importe:
              Number(
                importeCargoPendiente || 0
              ),
            origen_tipo: "ComprobanteEgreso",
            origen_id: comp.id,
            comprobanteegreso_id: comp.id,
            anulado: false,
            ordenpago_id: null, // por si la OP se elimina más abajo
            formapago_id: null,
          },
          { transaction: t }
        );
        compIdsAfectados.add(Number(comp.id));
      }
    }

    // ===== 4) Ajustar/eliminar la ORDEN DE PAGO =====
    if (orden) {
      const newTotal = Math.max(0, Number((Number(orden.total || 0) - montoPago).toFixed(2)));
      if (newTotal <= EPS) {
        await orden.destroy({ transaction: t });
      } else {
        await orden.update({ total: newTotal, estado: "pendiente_aplicacion" }, { transaction: t });
      }
    }

    // ===== 5) Recalcular COMPROBANTES afectados =====
    if (compIdsAfectados.size > 0) {

      for (
        const compId
        of compIdsAfectados
      ) {

        await recalcComprobanteEgreso(
          compId,
          t
        );

        await actualizarFormaPagoActualComprobante(
          compId,
          t
        );
      }
    }

    await t.commit();
    return res.json({ ok: true, mensaje: "Pago con tarjeta eliminado y efectos revertidos." });
  } catch (e) {
    await t.rollback();
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
