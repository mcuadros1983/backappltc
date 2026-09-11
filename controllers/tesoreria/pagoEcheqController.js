// controllers/tesoreria/pagoEcheqController.js
import { Op } from "sequelize";
import { sequelize } from "../../config/database.js";
import EcheqEmitido from "../../models/tesoreria/pagoecheq.js";
import CategoriaEgreso from "../../models/tesoreria/categoriaEgreso.js";
import MovimientoBancoTesoreria from "../../models/tesoreria/movimientobancotesoreria.js";
import MovimientoCtaCteProveedor from "../../models/tesoreria/movimientoctacteproveedor.js";
import MovimientoCtaCteProveedorAplic from "../../models/tesoreria/movimientoctacteproveedoraplicacion.js";
import MovimientoCajaTesoreria from "../../models/tesoreria/movimientocajatesoreria.js";
import OrdenPago from "../../models/tesoreria/ordendepago.js";
import ComprobanteEgreso from "../../models/iva/comprobanteegreso.js";
import PagoTarjetaCredito from "../../models/tesoreria/pagotarjetacredito.js";
import FormaPago from "../../models/comun/formapagotesoreria.js";

import FormaPagoTesoreria from "../../models/comun/formapagotesoreria.js";
import PagoProgramadoTesoreria
  from "../../models/tesoreria/PagoProgramadoTesoreria.js";

import {
  recalcularComprobanteEgreso,
} from "./helpers/recalcularComprobanteEgreso.js";
import AjusteComprobanteEgreso from "../../models/tesoreria/ajusteComprobanteEgreso.js";

const N = (n) => Number(n) || 0;
const toNum = (n) => (n == null || n === "" ? null : Number(n));
const EPS = 0.009;

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
    where: { descripcion: { [Op.in]: candidatosCodigo } },
    transaction: t,
  });
  if (byCode) return byCode.id;

  // 2) por nombre (ilike)
  const byName = await FormaPago.findOne({
    where: {
      [Op.or]: candidatosNombre.map((n) => ({ descripcion: { [Op.iLike]: `%${n}%` } })),
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
    const { empresa_id, egreso = {} } = req.body || {};
    const {
      fecha_emision,
      fecha_vencimiento,
      banco_id,
      proveedor_id,
      importe,
      numero_echeq,
      categoriaegreso_id,
      imputacioncontable_id,
      proyecto_id,
    } = egreso;

    if (!empresa_id) throw new Error("empresa_id requerido");
    if (!fecha_emision) throw new Error("fecha_emision requerida");
    if (!fecha_vencimiento) throw new Error("fecha_vencimiento requerida");
    if (!banco_id) throw new Error("banco_id requerido");
    if (!(N(importe) > 0)) throw new Error("importe > 0 requerido");

    if (new Date(fecha_vencimiento) < new Date(fecha_emision)) {
      throw new Error("fecha_vencimiento no puede ser anterior a fecha_emision");
    }

    const imputacion = await ensureImputacionFromCategoria(
      categoriaegreso_id,
      imputacioncontable_id,
      t
    );

    const ech = await EcheqEmitido.create(
      {
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
      },
      { transaction: t }
    );

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
   (el mov. banco se genera al 'acreditar')
   ========================================= */
export async function registrarAnticipoProveedorEcheq(req, res) {
  const t = await sequelize.transaction();
  try {
    const {
      empresa_id,
      proveedor_id,
      fecha,
      observaciones,
      pago = {}, // { banco_id, importe, fecha_emision?, fecha_vencimiento?, categoriaegreso_id, imputacioncontable_id?, proyecto_id?, numero_echeq?, formapago_id? }
      idempotencyKey,
    } = req.body || {};

    if (!empresa_id) throw new Error("empresa_id requerido");
    if (!proveedor_id) throw new Error("proveedor_id requerido");
    if (!N(pago.importe)) throw new Error("importe de pago requerido");
    if (!pago.banco_id) throw new Error("banco_id requerido");

    const fechaOP = fecha || pago.fecha_emision || new Date().toISOString().slice(0, 10);
    const fechaEmision = pago.fecha_emision || fechaOP;
    const fechaVto = pago.fecha_vencimiento || fechaEmision;
    if (new Date(fechaVto) < new Date(fechaEmision)) {
      throw new Error("fecha_vencimiento no puede ser anterior a fecha_emision");
    }

    // Idempotencia por OP
    if (idempotencyKey) {
      const opExistente = await OrdenPago.findOne({
        where: { idempotency_key: idempotencyKey },
        transaction: t,
      });
      if (opExistente) {
        const echeqs = await EcheqEmitido.findAll({
          where: { ordenpago_id: opExistente.id },
          transaction: t,
        });
        const ctaCte = await MovimientoCtaCteProveedor.findOne({
          where: { ordenpago_id: opExistente.id, tipo: "abono", anulado: { [Op.not]: true } },
          transaction: t,
        });
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

    const imputacion = await ensureImputacionFromCategoria(
      pago.categoriaegreso_id,
      pago.imputacioncontable_id,
      t
    );


    // 🔎 Resolver formapago_id para eCheq
    const formaPagoIdECheq = await resolveFormaPagoIdECheq(t);

    // 1) OP pendiente
    const orden = await OrdenPago.create(
      {
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
      },
      { transaction: t }
    );

    // 2) eCheq
    const ech = await EcheqEmitido.create(
      {
        empresa_id: toNum(empresa_id),
        proveedor_id: toNum(proveedor_id),
        banco_id: toNum(pago.banco_id),
        fecha_emision: fechaEmision,
        fecha_vencimiento: fechaVto,
        importe: N(pago.importe),
        numero_echeq: pago.numero_echeq || null,
        estado: "emitido",
        anulado: false,
        ordenpago_id: orden.id,
        categoriaegreso_id: toNum(pago.categoriaegreso_id) || null,
        imputacioncontable_id: toNum(imputacion) || null,
        proyecto_id: toNum(pago.proyecto_id) || null,
        comprobanteegreso_id: null,
        referencia_id: orden.id,
        referencia_tipo: "OrdenPago",
        // NOTA: no guardamos formapago_id en EcheqEmitido (no es necesario para el requerimiento actual)
      },
      { transaction: t }
    );

    // 3) ABONO en CtaCte (referencia al eCheq — única forma de pago)
    const movCtaCte = await MovimientoCtaCteProveedor.create(
      {
        proveedor_id: toNum(proveedor_id),
        empresa_id: toNum(empresa_id),
        fecha: fechaOP,
        fecha_pago: fechaVto,
        descripcion: `Anticipo proveedor por Echeq - OP #${orden.id}`,
        tipo: "abono",
        importe: N(pago.importe),
        origen_tipo: "OrdenPago",
        origen_id: orden.id,
        comprobanteegreso_id: null,
        anulado: false,
        ordenpago_id: orden.id,
        // ✅ seteamos la forma de pago (eCheq) si la encontramos
        formapago_id: formaPagoIdECheq || null,
        // (opcional) referencia directa al eCheq — útil para trazabilidad
        referencia_tipo: "EcheqEmitido",
        referencia_id: ech.id,
      },
      { transaction: t }
    );

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
   - Idempotencia por (referencia_tipo,id)
   ========================= */
export async function acreditarEcheq(req, res) {

  const t =
    await sequelize.transaction();

  try {

    const { id } =
      req.params;

    const {
      fecha_acreditacion,
    } = req.body || {};


    const ech =
      await EcheqEmitido.findByPk(
        id,
        {
          transaction: t,
          lock: t.LOCK.UPDATE,
        }
      );


    if (!ech) {
      throw new Error(
        "eCheq no encontrado"
      );
    }


    if (ech.anulado) {
      throw new Error(
        "El eCheq está anulado"
      );
    }


    /*
     * ==================================================
     * IDEMPOTENCIA
     * ==================================================
     *
     * Verificamos si ya existe el movimiento bancario
     * que materializó este eCheq.
     */

    const movPrev =
      await MovimientoBancoTesoreria.findOne({
        where: {
          referencia_tipo:
            "EcheqEmitido",

          referencia_id:
            ech.id,

          anulado:
            false,
        },

        transaction: t,
        lock: t.LOCK.UPDATE,
      });


    if (movPrev) {

      if (
        ech.estado !== "acreditado"
      ) {

        ech.estado =
          "acreditado";

        await ech.save({
          transaction: t,
        });
      }


      await t.commit();


      return res.json({
        ok:
          true,

        mensaje:
          "eCheq ya estaba acreditado",

        movimientoBanco:
          movPrev,

        echeq:
          ech,
      });
    }


    /*
     * ==================================================
     * FECHA DEL MOVIMIENTO BANCARIO
     * ==================================================
     */

    const fechaMov =
      fecha_acreditacion ||
      ech.fecha_vencimiento ||
      ech.fecha_emision;


    /*
     * ==================================================
     * CREAR MOVIMIENTO BANCARIO
     * ==================================================
     *
     * IMPORTANTE:
     *
     * El eCheq ya representa el pago del comprobante.
     *
     * Este movimiento representa solamente el impacto
     * posterior en Banco.
     *
     * Por eso:
     *
     * comprobanteegreso_id = NULL
     *
     * De lo contrario tendríamos:
     *
     * EcheqEmitido             $X
     * MovimientoBanco          $X
     *
     * computados como dos pagos diferentes.
     */

    const mov =
      await MovimientoBancoTesoreria.create(
        {
          empresa_id:
            ech.empresa_id,

          tipo:
            "egreso",

          descripcion:
            `Acreditación eCheq #${ech.id}${ech.numero_echeq
              ? ` (${ech.numero_echeq})`
              : ""
            }`,

          monto:
            N(ech.importe),

          fecha:
            fechaMov,

          banco_id:
            ech.banco_id,

          /*
           * El medio financiero original está
           * representado por EcheqEmitido.
           */
          formapago_id:
            null,

          /*
           * Esta es la relación técnica entre
           * MovimientoBanco y EcheqEmitido.
           */
          referencia_id:
            ech.id,

          referencia_tipo:
            "EcheqEmitido",

          observaciones:
            null,

          anulado:
            false,

          ordenpago_id:
            ech.ordenpago_id ||
            null,

          categoriaegreso_id:
            ech.categoriaegreso_id ||
            null,

          imputacioncontable_id:
            ech.imputacioncontable_id ||
            null,

          proveedor_id:
            ech.proveedor_id ||
            null,

          idempotency_key:
            null,

          /*
           * FUNDAMENTAL:
           *
           * NO volver a asociar directamente este
           * movimiento al comprobante.
           *
           * La asociación financiera ya existe:
           *
           * ComprobanteEgreso
           *       ↓
           * EcheqEmitido
           *       ↓
           * MovimientoBancoTesoreria
           */
          comprobanteegreso_id:
            null,
        },

        {
          transaction: t,
        }
      );


    /*
     * ==================================================
     * MARCAR ECHEQ COMO ACREDITADO
     * ==================================================
     */

    ech.estado =
      "acreditado";


    await ech.save({
      transaction: t,
    });


    await t.commit();


    return res.json({
      ok:
        true,

      mensaje:
        "eCheq acreditado",

      movimientoBanco:
        mov,

      echeq:
        ech,
    });


  } catch (e) {

    await t.rollback();


    console.error(
      "acreditarEcheq",
      e
    );


    return res.status(400).json({
      error:
        e.message ||
        "No se pudo acreditar el eCheq",
    });
  }
}

/* =========================
   RECHAZAR eCheq
   - Cambia estado a 'rechazado'
   - Si hubo OP, genera CARGO en CtaCte (reversa del abono)
   ========================= */
export async function rechazarEcheq(req, res) {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { fecha_rechazo, motivo } = req.body || {};
    const ech = await EcheqEmitido.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!ech) throw new Error("eCheq no encontrado");
    if (ech.anulado) throw new Error("El eCheq está anulado");
    if (ech.estado === "acreditado") throw new Error("No se puede rechazar un eCheq ya acreditado");

    let movCtaCte = null;
    if (ech.ordenpago_id && ech.proveedor_id) {
      const fecha = fecha_rechazo || new Date().toISOString().slice(0, 10);
      movCtaCte = await MovimientoCtaCteProveedor.create(
        {
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
        },
        { transaction: t }
      );
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
   ANULAR eCheq (soft)
   - Marca anulado=true y estado='anulado' (si no está acreditado)
   ========================= */
export async function anularEcheq(req, res) {

  const t =
    await sequelize.transaction();

  try {

    const id =
      Number(req.params.id);


    const ech =
      await EcheqEmitido.findByPk(
        id,
        {
          transaction: t,
          lock: t.LOCK.UPDATE,
        }
      );


    if (!ech) {
      throw new Error(
        "eCheq no encontrado"
      );
    }


    if (ech.anulado) {
      throw new Error(
        "El eCheq ya se encuentra anulado"
      );
    }


    /*
     * Un eCheq que ya fue acreditado bancariamente
     * tiene además un MovimientoBancoTesoreria.
     *
     * Ese caso debe revertirse desde Banco.
     */
    if (
      String(ech.estado || "")
        .trim()
        .toLowerCase() === "acreditado"
    ) {
      throw new Error(
        "No se puede anular un eCheq ya acreditado. Debe revertirse primero su movimiento bancario."
      );
    }


    /*
     * ============================================================
     * ¿EL ECHEQ PROVIENE DE UN PAGO PROGRAMADO?
     * ============================================================
     */

    let pagoProgramado =
      null;


    const referenciaTipo =
      String(
        ech.referencia_tipo ||
        ""
      )
        .trim()
        .toLowerCase();


    if (
      referenciaTipo ===
      "pagoprogramadotesoreria"
    ) {

      const pagoProgramadoId =
        Number(
          ech.referencia_id ||
          0
        );


      if (!pagoProgramadoId) {
        throw new Error(
          "El eCheq indica que proviene de un PagoProgramadoTesoreria pero no tiene referencia_id"
        );
      }


      pagoProgramado =
        await PagoProgramadoTesoreria.findByPk(
          pagoProgramadoId,
          {
            transaction: t,
            lock: t.LOCK.UPDATE,
          }
        );


      if (!pagoProgramado) {
        throw new Error(
          `No se encontró PagoProgramadoTesoreria #${pagoProgramadoId}`
        );
      }


      /*
       * Defensa de integridad:
       *
       * si el programado dice que fue materializado
       * por otro movimiento, no debemos tocarlo.
       */
      if (
        pagoProgramado.movimiento_tipo &&
        String(
          pagoProgramado.movimiento_tipo
        ) !== "EcheqEmitido"
      ) {
        throw new Error(
          `El pago programado #${pagoProgramado.id} está asociado a otro tipo de movimiento financiero`
        );
      }


      if (
        pagoProgramado.movimiento_id &&
        Number(
          pagoProgramado.movimiento_id
        ) !== Number(ech.id)
      ) {
        throw new Error(
          `El pago programado #${pagoProgramado.id} está asociado a otro movimiento`
        );
      }
    }


    /*
     * ============================================================
     * SI EL ECHEQ GENERÓ UN ABONO DE CTA. CTE. NO ANTICIPO
     * ============================================================
     *
     * Puede ocurrir cuando al acreditar el programado
     * se utilizó generar_abono_ctacte=true.
     *
     * En ese caso el abono fue creado específicamente
     * por este eCheq.
     *
     * Si ya fue aplicado a facturas, NO permitimos
     * anular automáticamente.
     * ============================================================
     */

    const abonosDelEcheq =
      await MovimientoCtaCteProveedor.findAll({
        where: {
          referencia_tipo:
            "EcheqEmitido",

          referencia_id:
            ech.id,

          tipo:
            "abono",

          anulado: {
            [Op.not]: true,
          },
        },

        transaction: t,
        lock: t.LOCK.UPDATE,
      });


    for (
      const abono
      of abonosDelEcheq
    ) {

      /*
       * Si este es precisamente el abono histórico
       * perteneciente al anticipo programado,
       * NO debemos eliminarlo.
       *
       * Después lo volveremos a apuntar al programado.
       */
      const esAbonoAnticipoProgramado =
        !!pagoProgramado &&
        pagoProgramado.tipo === "anticipo" &&
        pagoProgramado.movimiento_ctacte_id &&
        Number(
          pagoProgramado.movimiento_ctacte_id
        ) === Number(abono.id);


      if (
        esAbonoAnticipoProgramado
      ) {
        continue;
      }


      const aplicaciones =
        await MovimientoCtaCteProveedorAplic.count({
          where: {
            abono_id:
              abono.id,
          },

          transaction: t,
        });


      if (
        aplicaciones > 0
      ) {
        throw new Error(
          `No se puede anular el eCheq porque el abono de cuenta corriente #${abono.id} ya fue aplicado a facturas. Primero deben desaplicarse esas aplicaciones.`
        );
      }


      /*
       * El abono fue creado por la acreditación de
       * este pago y no tiene aplicaciones.
       *
       * Lo anulamos.
       */
      await abono.update(
        {
          anulado:
            true,
        },

        {
          transaction: t,
        }
      );
    }


    /*
     * ============================================================
     * ANTICIPO PROGRAMADO
     * ============================================================
     *
     * El abono ya existía ANTES del eCheq.
     *
     * Al acreditar hicimos:
     *
     * PagoProgramadoTesoreria
     *          ↓
     * EcheqEmitido
     *
     * y el abono pasó a referenciar EcheqEmitido.
     *
     * Ahora debemos restaurar:
     *
     * MovimientoCtaCteProveedor
     *          ↓
     * PagoProgramadoTesoreria
     *
     * SIN eliminar aplicaciones existentes.
     * ============================================================
     */

    if (
      pagoProgramado &&
      pagoProgramado.tipo === "anticipo" &&
      pagoProgramado.movimiento_ctacte_id
    ) {

      const movCtaCte =
        await MovimientoCtaCteProveedor.findByPk(
          pagoProgramado.movimiento_ctacte_id,
          {
            transaction: t,
            lock: t.LOCK.UPDATE,
          }
        );


      if (!movCtaCte) {
        throw new Error(
          "No se encontró el abono de cuenta corriente asociado al anticipo programado"
        );
      }


      if (movCtaCte.anulado) {
        throw new Error(
          "El abono asociado al anticipo programado se encuentra anulado"
        );
      }


      await movCtaCte.update(
        {
          referencia_tipo:
            "PagoProgramadoTesoreria",

          referencia_id:
            pagoProgramado.id,

          /*
           * Sigue siendo el mismo compromiso.
           */
          comprobanteegreso_id:
            pagoProgramado.comprobanteegreso_id ||
            null,

          fecha:
            pagoProgramado.fecha_programada,

          fecha_pago:
            pagoProgramado.fecha_programada,

          importe:
            Number(
              pagoProgramado.monto ||
              0
            ),

          formapago_id:
            pagoProgramado.formapago_id ||
            null,

          descripcion:
            `Anticipo programado #${pagoProgramado.id} - ${pagoProgramado.descripcion || ""}`,
        },

        {
          transaction: t,
        }
      );
    }


    /*
     * ============================================================
     * ANULAR ECHEQ
     * ============================================================
     */

    await ech.update(
      {
        anulado:
          true,

        estado:
          "anulado",
      },

      {
        transaction: t,
      }
    );


    /*
     * ============================================================
     * RESTAURAR PAGO PROGRAMADO A PENDIENTE
     * ============================================================
     */

    if (pagoProgramado) {

      await pagoProgramado.update(
        {
          estado:
            "pendiente",

          fecha_acreditacion:
            null,

          movimiento_tipo:
            null,

          movimiento_id:
            null,

          /*
           * Conservamos:
           *
           * comprobanteegreso_id
           * ordenpago_id
           * fecha_programada
           * monto
           * banco_id
           * echeq_fecha_vencimiento
           *
           * porque el compromiso sigue existiendo.
           */
        },

        {
          transaction: t,
        }
      );
    }


    /*
     * ============================================================
     * RECALCULAR COMPROBANTE
     * ============================================================
     *
     * Como EcheqEmitido ahora tiene anulado=true,
     * recalcularComprobanteEgreso ya no debe
     * considerarlo como pago activo.
     * ============================================================
     */

    let comprobanteRecalculado =
      null;


    const comprobanteId =
      Number(
        pagoProgramado?.comprobanteegreso_id ||
        ech.comprobanteegreso_id ||
        0
      );


    if (comprobanteId) {

      comprobanteRecalculado =
        await recalcularComprobanteEgreso(
          comprobanteId,
          t
        );
    }


    await t.commit();


    return res.json({
      ok:
        true,

      mensaje:
        pagoProgramado
          ? "eCheq anulado. El pago programado volvió a estado pendiente."
          : "eCheq anulado correctamente.",

      echeq:
        ech,

      pagoProgramado,

      comprobante:
        comprobanteRecalculado,
    });


  } catch (e) {

    await t.rollback();


    console.error(
      "anularEcheq",
      e
    );


    return res.status(400).json({
      error:
        e.message ||
        "No se pudo anular el eCheq",
    });
  }
}

/* =========================
   ELIMINAR eCheq (hard)
   - Reversa completa si estaba vinculado a OP/Abono/Aplicaciones
   ========================= */
export async function eliminarEcheqEmitido(req, res) {
  const t = await sequelize.transaction();
  const EPS = 0.0001;

  const safeRollback = async () => { try { if (!t.finished) await t.rollback(); } catch { } };
  const safeCommit = async () => { if (!t.finished) await t.commit(); };

  // === Helper: recalcular saldo/estado de un ComprobanteEgreso ===
  // Contempla:
  // - total / montoreal
  // - AjusteComprobanteEgreso aumenta
  // - AjusteComprobanteEgreso disminuye
  // - pagos directos
  // - aplicaciones de abonos de Cta.Cte.
  async function recalcComprobanteEgreso(compId, trx) {

    const EPS_REC =
      0.0001;


    // ============================================================
    // 1. COMPROBANTE
    // ============================================================

    const comp =
      await ComprobanteEgreso.findByPk(
        compId,
        {
          transaction:
            trx,

          lock:
            trx.LOCK.UPDATE,
        }
      );


    if (!comp) {
      return;
    }


    /*
     * Importe original/base del comprobante.
     *
     * Mantenemos la misma regla que ya utilizaba este helper:
     *
     * si montoreal > 0 → montoreal
     * si no            → total
     */

    const totalBase =
      Number(
        comp.montoreal ||
        0
      ) > 0

        ? Number(
          comp.montoreal
        )

        : Number(
          comp.total ||
          0
        );


    // ============================================================
    // 2. AJUSTES ACTIVOS DEL COMPROBANTE
    // ============================================================

    const ajustes =
      await AjusteComprobanteEgreso.findAll({
        where: {
          comprobanteegreso_id:
            compId,

          [Op.or]: [
            {
              anulado:
                false,
            },
            {
              anulado:
                null,
            },
          ],
        },

        attributes: [
          "id",
          "tipo",
          "importe",
        ],

        transaction:
          trx,
      });


    let totalAumentos =
      0;

    let totalDisminuciones =
      0;


    for (
      const ajuste
      of ajustes || []
    ) {

      const importe =
        Number(
          ajuste.importe ||
          0
        );


      if (
        !Number.isFinite(importe) ||
        importe <= 0
      ) {
        continue;
      }


      const tipo =
        String(
          ajuste.tipo ||
          ""
        )
          .trim()
          .toLowerCase();


      if (
        tipo ===
        "aumenta"
      ) {

        totalAumentos +=
          importe;

      } else if (
        tipo ===
        "disminuye"
      ) {

        totalDisminuciones +=
          importe;
      }
    }


    /*
     * Obligación efectiva:
     *
     * base
     * + aumentos
     * - disminuciones
     */

    const totalAjustado =
      Math.max(
        0,

        Number(
          (
            totalBase +
            totalAumentos -
            totalDisminuciones
          ).toFixed(2)
        )
      );


    // ============================================================
    // 3. PAGOS DIRECTOS REMANENTES
    // ============================================================

    const [
      cajaComp,
      bancoComp,
      tarjetaComp,
      echeqComp,
    ] =
      await Promise.all([

        MovimientoCajaTesoreria.findAll({
          where: {
            comprobanteegreso_id:
              compId,

            [Op.or]: [
              {
                anulado:
                  false,
              },
              {
                anulado:
                  null,
              },
            ],
          },

          transaction:
            trx,
        }),


        MovimientoBancoTesoreria.findAll({
          where: {
            comprobanteegreso_id:
              compId,

            [Op.or]: [
              {
                anulado:
                  false,
              },
              {
                anulado:
                  null,
              },
            ],
          },

          transaction:
            trx,
        }),


        PagoTarjetaCredito?.findAll?.({
          where: {
            comprobanteegreso_id:
              compId,

            [Op.or]: [
              {
                anulado:
                  false,
              },
              {
                anulado:
                  null,
              },
            ],
          },

          transaction:
            trx,
        }) || [],


        EcheqEmitido?.findAll?.({
          where: {
            comprobanteegreso_id:
              compId,

            [Op.or]: [
              {
                anulado:
                  false,
              },
              {
                anulado:
                  null,
              },
            ],
          },

          transaction:
            trx,
        }) || [],
      ]);


    const totalCaja =
      (cajaComp || [])
        .reduce(
          (
            acumulado,
            registro
          ) =>
            acumulado +
            Number(
              registro.monto ||
              0
            ),

          0
        );


    const totalBanco =
      (bancoComp || [])
        .reduce(
          (
            acumulado,
            registro
          ) =>
            acumulado +
            Number(
              registro.monto ||
              0
            ),

          0
        );


    const totalTarjeta =
      (tarjetaComp || [])
        .reduce(
          (
            acumulado,
            registro
          ) =>
            acumulado +
            Number(
              registro.importe ||
              0
            ),

          0
        );


    const totalEcheq =
      (echeqComp || [])
        .reduce(
          (
            acumulado,
            registro
          ) =>
            acumulado +
            Number(
              registro.importe ||
              0
            ),

          0
        );


    const pagosDirectos =
      Number(
        (
          totalCaja +
          totalBanco +
          totalTarjeta +
          totalEcheq
        ).toFixed(2)
      );


    // ============================================================
    // 4. ABONOS APLICADOS A CARGOS DE ESTE COMPROBANTE
    // ============================================================

    const cargosComp =
      await MovimientoCtaCteProveedor.findAll({
        where: {
          comprobanteegreso_id:
            compId,

          tipo:
            "cargo",

          [Op.or]: [
            {
              anulado:
                false,
            },
            {
              anulado:
                null,
            },
          ],
        },

        attributes: [
          "id",
        ],

        transaction:
          trx,
      });


    const cargoIds =
      cargosComp.map(
        cargo =>
          cargo.id
      );


    let aplicadoAbonos =
      0;


    if (
      cargoIds.length
    ) {

      const aplicaciones =
        await MovimientoCtaCteProveedorAplic.findAll({
          where: {
            cargo_id: {
              [Op.in]:
                cargoIds,
            },
          },

          attributes: [
            "importe",
          ],

          transaction:
            trx,
        });


      aplicadoAbonos =
        (aplicaciones || [])
          .reduce(
            (
              acumulado,
              aplicacion
            ) =>
              acumulado +
              Number(
                aplicacion.importe ||
                0
              ),

            0
          );
    }


    aplicadoAbonos =
      Number(
        aplicadoAbonos.toFixed(
          2
        )
      );


    // ============================================================
    // 5. TOTAL PAGADO REAL
    // ============================================================

    const pagadoReal =
      Number(
        (
          pagosDirectos +
          aplicadoAbonos
        ).toFixed(2)
      );


    // ============================================================
    // 6. SALDO
    // ============================================================

    const saldo =
      Math.max(
        0,

        Number(
          (
            totalAjustado -
            pagadoReal
          ).toFixed(2)
        )
      );


    // ============================================================
    // 7. ESTADO DEL COMPROBANTE
    // ============================================================

    let estadoComp =
      "impaga";


    if (
      Math.abs(
        saldo
      ) <= EPS_REC
    ) {

      estadoComp =
        "pagada";

    } else if (
      pagadoReal > EPS_REC &&
      saldo > EPS_REC
    ) {

      estadoComp =
        "parcial";
    }


    // ============================================================
    // 8. ACTUALIZAR COMPROBANTE
    // ============================================================

    const patch = {
      saldo:
        saldo,
    };


    if (
      Object.prototype.hasOwnProperty.call(
        comp.dataValues,
        "estadopago"
      )
    ) {

      patch.estadopago =
        estadoComp;
    }


    if (
      Object.prototype.hasOwnProperty.call(
        comp.dataValues,
        "estado"
      )
    ) {

      patch.estado =
        estadoComp;
    }


    await comp.update(
      patch,
      {
        transaction:
          trx,
      }
    );


    // ============================================================
    // 9. LOG DE CONTROL
    // ============================================================

    console.log(
      "[recalcComprobanteEgreso/echeq]",
      {
        compId,

        totalBase,

        ajustes: {
          cantidad:
            ajustes.length,

          aumenta:
            Number(
              totalAumentos.toFixed(
                2
              )
            ),

          disminuye:
            Number(
              totalDisminuciones.toFixed(
                2
              )
            ),
        },

        totalAjustado,

        pagos: {
          caja:
            Number(
              totalCaja.toFixed(
                2
              )
            ),

          banco:
            Number(
              totalBanco.toFixed(
                2
              )
            ),

          tarjeta:
            Number(
              totalTarjeta.toFixed(
                2
              )
            ),

          echeq:
            Number(
              totalEcheq.toFixed(
                2
              )
            ),

          aplicadoAbonos,
        },

        pagadoReal,

        saldo,

        estadoComp,
      }
    );
  }

  // // === Helper: recalcular saldo/estado de un ComprobanteEgreso de forma robusta ===
  // async function recalcComprobanteEgreso(compId, trx) {
  //   const EPS_REC = 0.0001;
  //   const comp = await ComprobanteEgreso.findByPk(compId, { transaction: trx });
  //   if (!comp) return;

  //   const totalComp =
  //     Number(comp.montoreal || 0) > 0
  //       ? Number(comp.montoreal)
  //       : Number(comp.total || 0);

  //   // Pagos directos remanentes (caja, banco, tarjeta, eCheq)
  //   const [cajaComp, bancoComp, tarjetaComp, echeqComp] = await Promise.all([
  //     MovimientoCajaTesoreria.findAll({
  //       where: {
  //         comprobanteegreso_id: compId,
  //         [Op.or]: [
  //           { anulado: false },
  //           { anulado: null },
  //         ],
  //       },
  //       transaction: trx,
  //     }),

  //     MovimientoBancoTesoreria.findAll({
  //       where: {
  //         comprobanteegreso_id: compId,
  //         [Op.or]: [
  //           { anulado: false },
  //           { anulado: null },
  //         ],
  //       },
  //       transaction: trx,
  //     }),

  //     PagoTarjetaCredito?.findAll?.({
  //       where: {
  //         comprobanteegreso_id: compId,
  //         [Op.or]: [
  //           { anulado: false },
  //           { anulado: null },
  //         ],
  //       },
  //       transaction: trx,
  //     }) || [],

  //     EcheqEmitido?.findAll?.({
  //       where: {
  //         comprobanteegreso_id: compId,
  //         [Op.or]: [
  //           { anulado: false },
  //           { anulado: null },
  //         ],
  //       },
  //       transaction: trx,
  //     }) || [],
  //   ]);

  //   const pagosDirectos =
  //     (cajaComp || []).reduce((a, r) => a + Number(r.monto || 0), 0) +
  //     (bancoComp || []).reduce((a, r) => a + Number(r.monto || 0), 0) +
  //     (tarjetaComp || []).reduce((a, r) => a + Number(r.importe || 0), 0) +
  //     (echeqComp || []).reduce((a, r) => a + Number(r.importe || 0), 0);

  //   // Abonos aplicados remanentes
  //   const cargosComp = await MovimientoCtaCteProveedor.findAll({
  //     where: {
  //       comprobanteegreso_id: compId,
  //       tipo: "cargo",
  //       [Op.or]: [
  //         { anulado: false },
  //         { anulado: null },
  //       ],
  //     },
  //     attributes: ["id"],
  //     transaction: trx,
  //   });
  //   const cargoIds = cargosComp.map(c => c.id);

  //   let aplicadoAbonos = 0;
  //   if (cargoIds.length) {
  //     const applsRest = await MovimientoCtaCteProveedorAplic.findAll({
  //       where: { cargo_id: { [Op.in]: cargoIds } },
  //       attributes: ["importe"],
  //       transaction: trx,
  //     });
  //     aplicadoAbonos = (applsRest || []).reduce((acc, a) => acc + Number(a.importe || 0), 0);
  //   }

  //   const pagadoReal = pagosDirectos + aplicadoAbonos;
  //   const saldo = Math.max(0, Number((totalComp - pagadoReal).toFixed(2)));

  //   let estadoComp = "impaga";
  //   if (Math.abs(saldo) <= EPS_REC) estadoComp = "pagada";
  //   else if (pagadoReal > EPS_REC && saldo > EPS_REC) estadoComp = "parcial";

  //   const patch = { saldo };
  //   if (Object.prototype.hasOwnProperty.call(comp.dataValues, "estadopago")) patch.estadopago = estadoComp;
  //   if (Object.prototype.hasOwnProperty.call(comp.dataValues, "estado")) patch.estado = estadoComp;

  //   await comp.update(patch, { transaction: trx });
  //   console.log("[recalcComprobanteEgreso/echeq]", { compId, totalComp, pagosDirectos, aplicadoAbonos, saldo, estadoComp });
  // }



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

    console.log(
      "💳 Actualizando forma de pago actual del comprobante:",
      {
        comprobante_id: compId,
        movimientos_caja: movimientosCaja.length,
        movimientos_banco: movimientosBanco.length,
        echeqs: echeqs.length,
        tarjetas: tarjetas.length,
        cargos_ctacte: cargosCtaCte.length,
        formas_detectadas: idsFormas,
        formapago_anterior: comp.formapago_id,
        formapago_nuevo: nuevaFormaPagoId,
      }
    );

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

  try {
    const id = Number(req.params.id);
    console.log("[echeq:delete] >>> start", { id });

    const ech = await EcheqEmitido.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!ech) throw new Error("eCheq no encontrado");

    console.log("[echeq:delete] found", {
      id: ech.id, estado: ech.estado, importe: ech.importe,
      ordenpago_id: ech.ordenpago_id, comprobanteegreso_id: ech.comprobanteegreso_id
    });

    if (String(ech.estado || "").toLowerCase() === "acreditado") {
      throw new Error("No se puede eliminar un eCheq acreditado (use reversa de banco)");
    }
    const referenciaTipoEcheq =
      String(
        ech.referencia_tipo || ""
      )
        .trim()
        .toLowerCase();


    if (
      referenciaTipoEcheq ===
      "pagoprogramadotesoreria" &&
      ech.referencia_id
    ) {

      console.log(
        "📅 Revirtiendo acreditación de PAGO PROGRAMADO desde ECHEQ:",
        ech.referencia_id
      );


      // ============================================================
      // 1. BUSCAR PAGO PROGRAMADO
      // ============================================================

      const pagoProgramado =
        await PagoProgramadoTesoreria.findByPk(
          ech.referencia_id,
          {
            transaction: t,
            lock: t.LOCK.UPDATE,
          }
        );


      if (!pagoProgramado) {
        throw new Error(
          `No se encontró PagoProgramadoTesoreria #${ech.referencia_id} asociado al eCheq.`
        );
      }


      if (
        String(
          pagoProgramado.estado || ""
        )
          .trim()
          .toLowerCase() !==
        "acreditado"
      ) {
        throw new Error(
          `El pago programado asociado se encuentra en estado ${pagoProgramado.estado}.`
        );
      }


      if (
        String(
          pagoProgramado.medio || ""
        )
          .trim()
          .toLowerCase() !==
        "echeq"
      ) {
        throw new Error(
          "El PagoProgramadoTesoreria asociado no corresponde a un pago por eCheq."
        );
      }


      /*
       * Defensa de relación inversa.
       */
      if (
        pagoProgramado.movimiento_tipo &&
        String(
          pagoProgramado.movimiento_tipo
        )
          .trim()
          .toLowerCase() !==
        "echeqemitido"
      ) {
        throw new Error(
          `El PagoProgramadoTesoreria #${pagoProgramado.id} está asociado a otro tipo de movimiento.`
        );
      }


      if (
        pagoProgramado.movimiento_id &&
        Number(
          pagoProgramado.movimiento_id
        ) !==
        Number(ech.id)
      ) {
        throw new Error(
          `El PagoProgramadoTesoreria #${pagoProgramado.id} está asociado a otro movimiento financiero.`
        );
      }


      // ============================================================
      // 2. LOCALIZAR ABONOS QUE AL ACREDITAR
      //    PASARON A APUNTAR AL ECHEQ REAL
      // ============================================================

      const abonosProgramado =
        await MovimientoCtaCteProveedor.findAll({
          where: {
            tipo:
              "abono",

            referencia_tipo:
              "EcheqEmitido",

            referencia_id:
              ech.id,

            anulado: {
              [Op.not]:
                true,
            },
          },

          transaction: t,
          lock: t.LOCK.UPDATE,
        });


      const abonoIds =
        abonosProgramado
          .map(
            abono =>
              Number(abono.id)
          )
          .filter(Boolean);


      // ============================================================
      // 3. RECUPERAR TODOS LOS COMPROBANTES AFECTADOS
      // ============================================================

      const comprobantesAfectados =
        new Set();


      if (
        pagoProgramado.comprobanteegreso_id
      ) {

        comprobantesAfectados.add(
          Number(
            pagoProgramado.comprobanteegreso_id
          )
        );
      }


      if (
        ech.comprobanteegreso_id
      ) {

        comprobantesAfectados.add(
          Number(
            ech.comprobanteegreso_id
          )
        );
      }


      /*
       * Recuperamos las facturas alcanzadas por las
       * aplicaciones de los abonos.
       *
       * IMPORTANTE:
       * NO eliminamos ninguna aplicación.
       */
      if (abonoIds.length > 0) {

        const aplicaciones =
          await MovimientoCtaCteProveedorAplic.findAll({
            where: {
              abono_id: {
                [Op.in]:
                  abonoIds,
              },
            },

            attributes: [
              "cargo_id",
            ],

            transaction: t,
          });


        const cargoIds =
          [
            ...new Set(
              aplicaciones
                .map(
                  aplicacion =>
                    Number(
                      aplicacion.cargo_id
                    )
                )
                .filter(Boolean)
            ),
          ];


        if (cargoIds.length > 0) {

          const cargos =
            await MovimientoCtaCteProveedor.findAll({
              where: {
                id: {
                  [Op.in]:
                    cargoIds,
                },

                tipo:
                  "cargo",

                anulado: {
                  [Op.not]:
                    true,
                },
              },

              attributes: [
                "id",
                "comprobanteegreso_id",
              ],

              transaction: t,
            });


          for (const cargo of cargos) {

            if (
              cargo.comprobanteegreso_id
            ) {

              comprobantesAfectados.add(
                Number(
                  cargo.comprobanteegreso_id
                )
              );
            }
          }
        }
      }


      // ============================================================
      // 4. RESTAURAR LOS ABONOS
      //    ECHEQ REAL → PAGO PROGRAMADO
      // ============================================================

      const descripcionPagoProgramado =
        String(
          pagoProgramado.descripcion || ""
        ).trim();


      for (
        const abono
        of abonosProgramado
      ) {

        await abono.update(
          {
            referencia_tipo:
              "PagoProgramadoTesoreria",

            referencia_id:
              pagoProgramado.id,

            fecha_pago:
              null,

            descripcion:
              `Pago programado pendiente #${pagoProgramado.id}` +
              (
                descripcionPagoProgramado
                  ? ` - ${descripcionPagoProgramado}`
                  : ""
              ) +
              ` · Pago acordado con: eCheq`,

            formapago_id:
              pagoProgramado.formapago_id ||
              abono.formapago_id ||
              null,
          },
          {
            transaction: t,
          }
        );
      }


      // ============================================================
      // 5. ELIMINAR ECHEQ REAL
      // ============================================================

      await ech.destroy({
        transaction: t,
      });


      // ============================================================
      // 6. PAGO PROGRAMADO
      //    ACREDITADO → PENDIENTE
      // ============================================================

      await pagoProgramado.update(
        {
          estado:
            "pendiente",

          fecha_acreditacion:
            null,

          movimiento_tipo:
            null,

          movimiento_id:
            null,
        },
        {
          transaction: t,
        }
      );


      // ============================================================
      // 7. RECALCULAR TODOS LOS COMPROBANTES AFECTADOS
      // ============================================================

      const resultadosComprobantes =
        [];


      for (
        const comprobanteId
        of comprobantesAfectados
      ) {

        const resultado =
          await recalcularComprobanteEgreso(
            comprobanteId,
            t
          );


        await actualizarFormaPagoActualComprobante(
          comprobanteId,
          t
        );


        resultadosComprobantes.push(
          resultado
        );
      }


      // ============================================================
      // 8. COMMIT
      // ============================================================

      await safeCommit();


      return res.json({
        ok:
          true,

        mensaje:
          "Acreditación del Pago Programado revertida. El eCheq fue eliminado y el Pago Programado volvió a estado pendiente.",

        pagoProgramado_id:
          pagoProgramado.id,

        pagoProgramado_estado:
          "pendiente",

        comprobantes_afectados:
          [
            ...comprobantesAfectados,
          ],

        comprobantes:
          resultadosComprobantes,
      });
    }
    // ============================================================
    // 1.a) BUSCAR TODOS LOS ABONOS QUE REFERENCIAN
    //      DIRECTAMENTE A ESTE ECHEQ
    // ============================================================

    const abonosRef =
      await MovimientoCtaCteProveedor.findAll({
        where: {
          referencia_tipo:
            "EcheqEmitido",

          referencia_id:
            ech.id,

          tipo:
            "abono",

          anulado: {
            [Op.not]:
              true,
          },
        },

        transaction: t,
        lock: t.LOCK.UPDATE,
      });


    console.log(
      "[echeq:delete] abonos directos:",
      abonosRef.map(
        (abono) => abono.id
      )
    );


    const tieneAbonosDirectos =
      abonosRef.length > 0;

    // (b) Abonos por la misma OP (fallback)
    /*
     * El fallback por OP sólo tiene sentido para un eCheq
     * que NO está vinculado directamente a un comprobante.
     *
     * Si existe comprobanteegreso_id, no debemos utilizar
     * cualquier abono de la misma OP para absorber la
     * reversión del eCheq.
     */
    const abonosViaOP =
      !tieneAbonosDirectos &&
        !ech.comprobanteegreso_id &&
        ech.ordenpago_id

        ? await MovimientoCtaCteProveedor.findAll({
          where: {
            ordenpago_id:
              ech.ordenpago_id,

            tipo:
              "abono",

            anulado: {
              [Op.not]:
                true,
            },
          },

          transaction: t,
          lock: t.LOCK.UPDATE,
        })

        : [];

    console.log(
      "[echeq:delete] abonosRef:",
      abonosRef.map(
        (abono) => ({
          abono_id:
            abono.id,

          importe:
            abono.importe,
        })
      )
    );

    const compIdsAfectados = new Set();
    if (ech.comprobanteegreso_id) compIdsAfectados.add(Number(ech.comprobanteegreso_id));

    // Flag para decidir si crear CARGO de reversión
    let debeCrearCargo = true;
    // ============================================================
    // 2) SI HAY ABONOS DIRECTOS:
    //    ELIMINAR TODAS SUS APLICACIONES Y TODOS LOS ABONOS
    // ============================================================

    if (
      tieneAbonosDirectos
    ) {

      const abonoIds =
        abonosRef
          .map(
            (abono) =>
              Number(abono.id)
          )
          .filter(Boolean);


      /*
       * Primero recogemos cualquier comprobante
       * informado directamente en los ABONOS.
       */
      for (
        const abono
        of abonosRef
      ) {

        const compFromAbono =
          Number(
            abono.comprobanteegreso_id ||
            0
          );


        if (compFromAbono) {

          compIdsAfectados.add(
            compFromAbono
          );
        }
      }


      /*
       * Recuperamos TODAS las aplicaciones pertenecientes
       * a TODOS los ABONOS de este eCheq.
       */
      const aplicaciones =
        await MovimientoCtaCteProveedorAplic.findAll({
          where: {
            abono_id: {
              [Op.in]:
                abonoIds,
            },
          },

          transaction: t,
          lock: t.LOCK.UPDATE,
        });


      /*
       * Recuperamos los comprobantes afectados
       * a través de los CARGOS.
       */
      if (
        aplicaciones.length > 0
      ) {

        const cargoIds =
          [
            ...new Set(
              aplicaciones
                .map(
                  (aplicacion) =>
                    Number(
                      aplicacion.cargo_id
                    )
                )
                .filter(Boolean)
            ),
          ];


        if (
          cargoIds.length > 0
        ) {

          const cargos =
            await MovimientoCtaCteProveedor.findAll({
              where: {
                id: {
                  [Op.in]:
                    cargoIds,
                },
              },

              attributes: [
                "id",
                "comprobanteegreso_id",
              ],

              transaction: t,
            });


          for (
            const cargo
            of cargos
          ) {

            const compId =
              Number(
                cargo.comprobanteegreso_id ||
                0
              );


            if (compId) {

              compIdsAfectados.add(
                compId
              );
            }
          }
        }


        /*
         * Eliminamos TODAS las aplicaciones.
         */
        await MovimientoCtaCteProveedorAplic.destroy({
          where: {
            abono_id: {
              [Op.in]:
                abonoIds,
            },
          },

          transaction: t,
        });


        console.log(
          "[echeq:delete] aplicaciones eliminadas:",
          {
            abonoIds,
            cantidad:
              aplicaciones.length,
          }
        );
      }


      /*
       * Eliminamos TODOS los ABONOS.
       *
       * Los CARGOS originales permanecen,
       * porque representan las deudas de las facturas.
       */
      await MovimientoCtaCteProveedor.destroy({
        where: {
          id: {
            [Op.in]:
              abonoIds,
          },
        },

        transaction: t,
      });


      console.log(
        "[echeq:delete] abonos directos eliminados:",
        abonoIds
      );


      /*
       * Como existían ABONOS aplicados sobre los
       * CARGOS originales, NO debemos crear
       * ningún CARGO nuevo.
       */
      debeCrearCargo =
        false;
    }

    // ===== 2.bis) Si NO hubo abono directo pero SÍ abonos vía OP:
    // limpiar aplicaciones y reducir/destruir esos abonos repartiendo el importe del eCheq
    if (
      !tieneAbonosDirectos &&
      abonosViaOP.length > 0
    ) {
      let restante = Number(ech.importe || 0);

      // orden determinista
      abonosViaOP.sort((a, b) => Number(a.id) - Number(b.id));

      for (const ab of abonosViaOP) {
        // considerar comp del propio abono
        const compFromAb = Number(ab.comprobanteegreso_id || 0);
        if (compFromAb) compIdsAfectados.add(compFromAb);

        // limpiar aplicaciones y recolectar comp por cargos
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
              const compId = Number(cg.comprobanteegreso_id || 0);
              if (compId) compIdsAfectados.add(compId);
            }
          }
          await MovimientoCtaCteProveedorAplic.destroy({ where: { abono_id: ab.id }, transaction: t });
        }

        if (restante <= EPS) break;

        const imp = Number(ab.importe || 0);
        if (imp <= restante + EPS) {
          // se consume entero este abono
          restante = Math.max(0, Number((restante - imp).toFixed(2)));
          await ab.destroy({ transaction: t });
        } else {
          // reducción parcial
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
      //
      // Si encontramos abonos vinculados por la OP,
      // la reversión ya fue absorbida por esos abonos.
      //
      // No debemos crear además un nuevo CARGO por
      // el importe completo del eCheq.
      //
      debeCrearCargo = false;
      // Observación: si quedara 'restante' > 0, lo absorberá el CARGO condicional si corresponde.
    }

    // ===== 3) Ajustar OP si corresponde
    if (ech.ordenpago_id) {

      const orden =
        await OrdenPago.findByPk(
          ech.ordenpago_id,
          {
            transaction: t,
            lock: t.LOCK.UPDATE,
          }
        );


      if (orden) {

        /*
         * Si el eCheq estaba pagando directamente un comprobante,
         * la obligación NO disminuye.
         *
         * La OP sigue representando la deuda del comprobante.
         * Sólo vuelve a quedar pendiente de aplicación.
         */
        if (ech.comprobanteegreso_id) {

          await orden.update(
            {
              estado:
                "pendiente_aplicacion",
            },
            {
              transaction: t,
            }
          );


          console.log(
            "[echeq:delete] OP del comprobante conservada",
            {
              id:
                orden.id,

              total:
                orden.total,
            }
          );

        } else {

          /*
           * Para eCheq independiente sí podemos reducir
           * la OP correspondiente.
           */
          const newTotal =
            Math.max(
              0,
              Number(
                (
                  Number(
                    orden.total ||
                    0
                  ) -
                  Number(
                    ech.importe ||
                    0
                  )
                ).toFixed(2)
              )
            );


          console.log(
            "[echeq:delete] OP independiente before/after",
            {
              id:
                orden.id,

              total_old:
                orden.total,

              total_new:
                newTotal,
            }
          );


          if (newTotal <= EPS) {

            await orden.destroy({
              transaction: t,
            });

          } else {

            await orden.update(
              {
                total:
                  newTotal,

                estado:
                  "pendiente_aplicacion",
              },
              {
                transaction: t,
              }
            );
          }
        }
      }
    }

    // ===== 4) Eliminar el eCheq AHORA (así no entra en la recalculación)
    await ech.destroy({ transaction: t });
    console.log("[echeq:delete] eCheq eliminado", { id });

    // ===== 4.bis) (CONDICIONAL) Generar CARGO si NO hubo abonoRef directo y el eCheq estaba ligado a un comprobante
    // if (debeCrearCargo && ech.comprobanteegreso_id) {
    //   const comp = await ComprobanteEgreso.findByPk(ech.comprobanteegreso_id, { transaction: t, lock: t.LOCK.UPDATE });
    //   if (comp) {
    //     const descCtaCte = `Reversión pago con eCheq de comp. ${comp.nrocomprobante ?? comp.id}`;
    //     const fechaCtaCte = ech.fecha_emision || comp.fechacomprobante || new Date().toISOString().slice(0, 10);
    //     const importeCargo = Number(ech.importe || 0);

    //     await MovimientoCtaCteProveedor.create(
    //       {
    //         proveedor_id: comp.proveedor_id || ech.proveedor_id || null,
    //         empresa_id: comp.empresa_id || ech.empresa_id || null,
    //         fecha: fechaCtaCte,
    //         fecha_pago: null,
    //         descripcion: descCtaCte,
    //         tipo: "cargo",
    //         importe: importeCargo,           // mismo monto del eCheq eliminado
    //         origen_tipo: "ComprobanteEgreso",
    //         origen_id: comp.id,
    //         comprobanteegreso_id: comp.id,
    //         anulado: true,
    //         ordenpago_id: null,              // evitar referencias colgantes si la OP se eliminó
    //         formapago_id: comp.formapago_id || null,
    //       },
    //       { transaction: t }
    //     );

    //     compIdsAfectados.add(comp.id);
    //     console.log("[echeq:delete] CARGO creado en ctacte (reversión eCheq)", { compId: comp.id, importe: importeCargo });
    //   }
    // }

    // ===== 4.bis) Restaurar deuda en CtaCte si el eCheq estaba ligado a un comprobante
    if (debeCrearCargo && ech.comprobanteegreso_id) {

      const comp = await ComprobanteEgreso.findByPk(
        ech.comprobanteegreso_id,
        {
          transaction: t,
          lock: t.LOCK.UPDATE,
        }
      );

      if (comp) {

        const descCtaCte =
          `Reversión pago con eCheq de comp. ${comp.nrocomprobante ?? comp.id}`;

        const fechaCtaCte =
          ech.fecha_emision ||
          comp.fechacomprobante ||
          new Date().toISOString().slice(0, 10);

        const importeCargo =
          Number(ech.importe || 0);

        if (importeCargo > EPS) {

          const nuevoCargo =
            await MovimientoCtaCteProveedor.create(
              {
                proveedor_id:
                  comp.proveedor_id ||
                  ech.proveedor_id ||
                  null,

                empresa_id:
                  comp.empresa_id ||
                  ech.empresa_id ||
                  null,

                fecha:
                  fechaCtaCte,

                fecha_pago:
                  null,

                descripcion:
                  descCtaCte,

                tipo:
                  "cargo",

                /*
                 * Restauramos exactamente la deuda correspondiente
                 * al eCheq que estamos eliminando.
                 */
                importe:
                  importeCargo,

                origen_tipo:
                  "ComprobanteEgreso",

                origen_id:
                  comp.id,

                comprobanteegreso_id:
                  comp.id,

                anulado:
                  false,

                ordenpago_id:
                  null,

                formapago_id:
                  null,
              },
              {
                transaction: t,
              }
            );

          console.log(
            "[echeq:delete] CARGO activo creado en CtaCte por reversión de eCheq",
            {
              cargo_id:
                nuevoCargo.id,

              compId:
                comp.id,

              importe:
                importeCargo,
            }
          );
        }

        compIdsAfectados.add(comp.id);
      }
    }

    // ===== 5) Recalcular comprobantes afectados
    // Ya no existe el eCheq y ya fueron reconstruidos
    // los efectos de Cuenta Corriente.
    console.log(
      "[echeq:delete] compIdsAfectados:",
      Array.from(compIdsAfectados)
    );

    for (
      const compId
      of compIdsAfectados
    ) {

      await recalcularComprobanteEgreso(
        compId,
        t
      );

      await actualizarFormaPagoActualComprobante(
        compId,
        t
      );
    }

    await safeCommit();
    return res.json({
      ok: true,
      mensaje: "eCheq eliminado y efectos revertidos (OP/abono/aplicaciones).",
      comprobantes_recalculados: Array.from(compIdsAfectados),
    });

  } catch (e) {
    console.error("[echeq:delete] ERROR:", e.message);
    await safeRollback();
    return res.status(500).json({ error: e.message || "Error al eliminar eCheq" });
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

// export async function actualizarEcheqEmitido(req, res) {
//   try {
//     const ech = await EcheqEmitido.findByPk(req.params.id);
//     if (!ech) return res.status(404).json({ error: "eCheq no encontrado" });

//     if (req.body?.fecha_vencimiento && ech.fecha_emision) {
//       if (new Date(req.body.fecha_vencimiento) < new Date(ech.fecha_emision)) {
//         return res.status(400).json({ error: "fecha_vencimiento no puede ser anterior a fecha_emision" });
//       }
//     }

//     if (req.body?.categoriaegreso_id && !req.body?.imputacioncontable_id) {
//       const imp = await ensureImputacionFromCategoria(req.body.categoriaegreso_id, null, null);
//       req.body.imputacioncontable_id = imp;
//     }

//     await ech.update(req.body);
//     return res.json(ech);
//   } catch (e) {
//     console.error("actualizarEcheqEmitido", e);
//     return res.status(500).json({ error: "Error al actualizar eCheq" });
//   }
// }

export async function actualizarEcheqEmitido(req, res) {

  const t =
    await sequelize.transaction();

  try {

    const id =
      Number(req.params.id);


    const ech =
      await EcheqEmitido.findByPk(
        id,
        {
          transaction: t,
          lock: t.LOCK.UPDATE,
        }
      );


    if (!ech) {
      throw new Error(
        "eCheq no encontrado"
      );
    }


    if (ech.anulado) {
      throw new Error(
        "No se puede modificar un eCheq anulado"
      );
    }


    const estadoActual =
      String(
        ech.estado || ""
      ).toLowerCase();


    if (
      ![
        "emitido",
        "entregado",
        "presentado",
      ].includes(
        estadoActual
      )
    ) {
      throw new Error(
        `No se puede modificar un eCheq en estado ${ech.estado}`
      );
    }


    // =====================================================
    // DATOS ACTUALES
    // =====================================================

    // const tieneComprobante =
    //   !!ech.comprobanteegreso_id;


    // const esAnticipo =
    //   !!ech.ordenpago_id;

    const tieneComprobante =
      !!ech.comprobanteegreso_id;


    // =====================================================
    // DETERMINAR SI REALMENTE ES UN ANTICIPO
    // =====================================================
    let ordenAsociada =
      null;

    let esAnticipo =
      false;


    if (ech.ordenpago_id) {

      ordenAsociada =
        await OrdenPago.findByPk(
          ech.ordenpago_id,
          {
            transaction: t,
            lock: t.LOCK.UPDATE,
          }
        );


      if (!ordenAsociada) {
        throw new Error(
          "El eCheq tiene una orden de pago asociada que no existe"
        );
      }


      esAnticipo =
        ordenAsociada.origen ===
        "anticipo_echeq";
    }

    // =====================================================
    // CAMPOS SIEMPRE MODIFICABLES
    // =====================================================

    const fechaEmision =
      req.body?.fecha_emision ||
      ech.fecha_emision;


    const fechaVencimiento =
      req.body?.fecha_vencimiento ||
      ech.fecha_vencimiento;


    if (
      !fechaEmision ||
      !fechaVencimiento
    ) {
      throw new Error(
        "Debe indicar fecha de emisión y vencimiento"
      );
    }


    if (
      new Date(fechaVencimiento) <
      new Date(fechaEmision)
    ) {
      throw new Error(
        "fecha_vencimiento no puede ser anterior a fecha_emision"
      );
    }


    const patch = {

      fecha_emision:
        fechaEmision,

      fecha_vencimiento:
        fechaVencimiento,

      numero_echeq:
        req.body?.numero_echeq !== undefined
          ? (
            req.body.numero_echeq ||
            null
          )
          : ech.numero_echeq,

      proyecto_id:
        req.body?.proyecto_id !== undefined
          ? (
            toNum(
              req.body.proyecto_id
            ) || null
          )
          : ech.proyecto_id,
    };


    // =====================================================
    // CATEGORÍA + IMPUTACIÓN
    // =====================================================

    if (
      req.body?.categoriaegreso_id !==
      undefined
    ) {

      const categoriaId =
        toNum(
          req.body.categoriaegreso_id
        );


      if (!categoriaId) {
        throw new Error(
          "Debe seleccionar una categoría de egreso"
        );
      }


      const imputacion =
        await ensureImputacionFromCategoria(
          categoriaId,
          null,
          t
        );


      patch.categoriaegreso_id =
        categoriaId;

      patch.imputacioncontable_id =
        toNum(imputacion);
    }


    // =====================================================
    // PROVEEDOR / MONTO
    //
    // Sólo pueden modificarse cuando el eCheq todavía
    // NO está asignado a un comprobante.
    // =====================================================

    if (!tieneComprobante) {

      const proveedorNuevo =
        req.body?.proveedor_id !== undefined
          ? (
            toNum(
              req.body.proveedor_id
            ) || null
          )
          : (
            ech.proveedor_id ||
            null
          );


      const montoNuevo =
        req.body?.importe !== undefined
          ? N(
            req.body.importe
          )
          : N(
            ech.importe
          );


      if (!(montoNuevo > 0)) {
        throw new Error(
          "El importe debe ser mayor a cero"
        );
      }


      // ===================================================
      // SI ES ANTICIPO
      // Debemos sincronizar OP + ABONO CTA CTE
      // ===================================================

      if (esAnticipo) {

        if (!proveedorNuevo) {
          throw new Error(
            "El anticipo debe tener un proveedor"
          );
        }


        // const orden =
        //   await OrdenPago.findByPk(
        //     ech.ordenpago_id,
        //     {
        //       transaction: t,
        //       lock: t.LOCK.UPDATE,
        //     }
        //   );


        // if (!orden) {
        //   throw new Error(
        //     "No se encontró la orden de pago asociada al anticipo"
        //   );
        // }


        // Buscar primero por referencia directa al eCheq.
        // Es la relación que crea registrarAnticipoProveedorEcheq.
        let abono =
          await MovimientoCtaCteProveedor.findOne({
            where: {
              referencia_tipo:
                "EcheqEmitido",

              referencia_id:
                ech.id,

              tipo:
                "abono",

              anulado: {
                [Op.not]: true,
              },
            },

            transaction: t,
            lock: t.LOCK.UPDATE,
          });


        // Fallback por OP para registros históricos.
        if (!abono) {

          abono =
            await MovimientoCtaCteProveedor.findOne({
              where: {
                ordenpago_id:
                  ech.ordenpago_id,

                tipo:
                  "abono",

                anulado: {
                  [Op.not]: true,
                },
              },

              transaction: t,
              lock: t.LOCK.UPDATE,
            });
        }


        if (!abono) {
          throw new Error(
            "No se encontró el abono de cuenta corriente asociado al anticipo"
          );
        }


        // =================================================
        // VERIFICAR APLICACIONES DEL ABONO
        // =================================================

        const aplicaciones =
          await MovimientoCtaCteProveedorAplic.findAll({
            where: {
              abono_id:
                abono.id,
            },

            transaction: t,
            lock: t.LOCK.UPDATE,
          });


        const totalAplicado =
          aplicaciones.reduce(
            (acc, item) =>
              acc +
              N(item.importe),
            0
          );


        // No podemos reducir el anticipo por debajo
        // de dinero que ya fue aplicado a comprobantes.
        if (
          montoNuevo + EPS <
          totalAplicado
        ) {
          throw new Error(
            `No se puede reducir el importe a $${montoNuevo.toFixed(
              2
            )} porque ya existen $${totalAplicado.toFixed(
              2
            )} aplicados a comprobantes`
          );
        }


        const cambiaProveedor =
          Number(
            proveedorNuevo || 0
          ) !==
          Number(
            ech.proveedor_id || 0
          );


        // Si ya existen aplicaciones, cambiar proveedor
        // dejaría aplicaciones contra cargos del proveedor anterior.
        if (
          cambiaProveedor &&
          aplicaciones.length > 0
        ) {
          throw new Error(
            "No se puede cambiar el proveedor porque el anticipo ya tiene aplicaciones en cuenta corriente"
          );
        }


        // =================================================
        // ACTUALIZAR ORDEN DE PAGO
        // =================================================

        // =================================================
        // ACTUALIZAR ORDEN DE PAGO
        // =================================================

        if (!ordenAsociada) {
          throw new Error(
            "No se encontró la orden de pago asociada al anticipo"
          );
        }

        await ordenAsociada.update(
          {
            proveedor_id:
              proveedorNuevo,

            total:
              montoNuevo,

            fecha:
              fechaEmision,
          },
          {
            transaction: t,
          }
        );


        // =================================================
        // ACTUALIZAR ABONO CTA CTE
        // =================================================

        await abono.update(
          {
            proveedor_id:
              proveedorNuevo,

            importe:
              montoNuevo,

            fecha:
              fechaEmision,

            fecha_pago:
              fechaVencimiento,
          },
          {
            transaction: t,
          }
        );
      }


      // ===================================================
      // ACTUALIZAR ECHEQ
      // ===================================================

      patch.proveedor_id =
        proveedorNuevo;

      patch.importe =
        montoNuevo;

    } else {

      // ===================================================
      // TIENE COMPROBANTE
      //
      // Ignoramos cualquier intento de cambiar proveedor
      // o importe desde el cliente.
      // ===================================================

      patch.proveedor_id =
        ech.proveedor_id;

      patch.importe =
        ech.importe;
    }

    // =====================================================
    // BANCO
    //
    // Puede modificarse mientras el eCheq se encuentre
    // en un estado previo a su acreditación.
    // =====================================================

    const bancoFinal =
      req.body?.banco_id !== undefined
        ? toNum(
          req.body.banco_id
        )
        : toNum(
          ech.banco_id
        );


    if (!bancoFinal) {
      throw new Error(
        "Debe seleccionar un banco"
      );
    }


    patch.banco_id =
      bancoFinal;

    // =====================================================
    // GUARDAR ECHEQ
    // =====================================================

    await ech.update(
      patch,
      {
        transaction: t,
      }
    );


    await t.commit();


    return res.json({
      ok: true,

      echeq:
        ech,

      restricciones: {
        tiene_comprobante:
          tieneComprobante,

        es_anticipo:
          esAnticipo,

        proveedor_monto_editables:
          !tieneComprobante,
      },
    });


  } catch (e) {

    await t.rollback();


    console.error(
      "actualizarEcheqEmitido",
      e
    );


    return res.status(400).json({
      error:
        e.message ||
        "Error al actualizar eCheq",
    });
  }
}