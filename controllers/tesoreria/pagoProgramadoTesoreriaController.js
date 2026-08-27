import { Op } from "sequelize";
import { sequelize } from "../../config/database.js";

import PagoProgramadoTesoreria
  from "../../models/tesoreria/PagoProgramadoTesoreria.js";

import MovimientoCtaCteProveedor
  from "../../models/tesoreria/movimientoctacteproveedor.js";

import MovimientoCajaTesoreria
  from "../../models/tesoreria/movimientocajatesoreria.js";

import MovimientoBancoTesoreria
  from "../../models/tesoreria/movimientobancotesoreria.js";

import OrdenPago from "../../models/tesoreria/ordendepago.js";

import MovCtaCteProvAplic
  from "../../models/tesoreria/movimientoctacteproveedoraplicacion.js";

/*
 * IMPORTANTE:
 * Para CategoriaEgreso copiá EXACTAMENTE el import que ya
 * utiliza movimientoCajaTesoreriaController.js.
 */
import CategoriaEgreso
  from "../../models/tesoreria/categoriaEgreso.js";

import ComprobanteEgreso
  from "../../models/iva/comprobanteegreso.js";

import {
  recalcularComprobanteEgreso,
} from "./helpers/recalcularComprobanteEgreso.js";

const N = (value) => Number(value) || 0;

export const registrarPagoProgramado = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const {
      empresa_id,
      proveedor_id,

      // egreso_varios | anticipo
      tipo,

      // caja | banco
      medio,

      fecha_programada,
      monto,
      descripcion,
      observaciones,

      formapago_id,

      banco_id,
      caja_id,

      categoriaegreso_id,
      imputacioncontable_id,
      proyecto_id,

      idempotencyKey,

      // Si es true, el movimiento quedará disponible
      // como abono para aplicar a varias facturas.
      generar_abono_ctacte = false,
    } = req.body || {};


    // ==============================
    // VALIDACIONES
    // ==============================

    if (!empresa_id) {
      throw new Error("empresa_id requerido");
    }

    if (!proveedor_id) {
      throw new Error("proveedor_id requerido");
    }

    if (!["egreso_varios", "anticipo"].includes(tipo)) {
      throw new Error(
        "tipo debe ser egreso_varios o anticipo"
      );
    }

    if (!["caja", "banco"].includes(medio)) {
      throw new Error(
        "medio debe ser caja o banco"
      );
    }

    if (!fecha_programada) {
      throw new Error(
        "fecha_programada requerida"
      );
    }

    if (!(N(monto) > 0)) {
      throw new Error(
        "Monto inválido"
      );
    }

    if (!descripcion?.trim()) {
      throw new Error(
        "descripcion requerida"
      );
    }

    if (!categoriaegreso_id) {
      throw new Error(
        "categoriaegreso_id requerido"
      );
    }

    if (
      medio === "banco" &&
      !banco_id
    ) {
      throw new Error(
        "banco_id requerido para pagos bancarios"
      );
    }


    // ==============================
    // IDEMPOTENCIA
    // ==============================

    if (idempotencyKey) {
      const existente =
        await PagoProgramadoTesoreria.findOne({
          where: {
            idempotency_key:
              idempotencyKey,
          },

          transaction: t,
        });

      if (existente) {
        await t.commit();

        return res.status(200).json({
          ok: true,
          reutilizado: true,
          pagoProgramado:
            existente,
        });
      }
    }


    // ==============================
    // IMPUTACIÓN
    // ==============================

    let imputacion =
      imputacioncontable_id || null;

    if (!imputacion) {
      const categoria =
        await CategoriaEgreso.findByPk(
          categoriaegreso_id,
          {
            transaction: t,
          }
        );

      if (!categoria) {
        throw new Error(
          "La categoría indicada no existe"
        );
      }

      if (!categoria.imputacioncontable_id) {
        throw new Error(
          "La categoría no tiene imputación contable asociada"
        );
      }

      imputacion =
        categoria.imputacioncontable_id;
    }


    // ==============================
    // CREAR PROGRAMADO
    // ==============================

    const pago =
      await PagoProgramadoTesoreria.create(
        {
          empresa_id:
            Number(empresa_id),

          proveedor_id:
            Number(proveedor_id),

          tipo,
          medio,

          fecha_programada,

          monto:
            N(monto),

          descripcion:
            descripcion.trim(),

          observaciones:
            observaciones?.trim() || null,

          formapago_id:
            formapago_id
              ? Number(formapago_id)
              : null,

          banco_id:
            banco_id
              ? Number(banco_id)
              : null,

          caja_id:
            caja_id
              ? Number(caja_id)
              : null,

          categoriaegreso_id:
            Number(categoriaegreso_id),

          imputacioncontable_id:
            Number(imputacion),

          proyecto_id:
            proyecto_id
              ? Number(proyecto_id)
              : null,

          comprobanteegreso_id:
            null,

          ordenpago_id:
            null,

          movimiento_ctacte_id:
            null,

          estado:
            "pendiente",

          fecha_acreditacion:
            null,

          movimiento_tipo:
            null,

          movimiento_id:
            null,

          idempotency_key:
            idempotencyKey || null,
        },

        {
          transaction: t,
        }
      );


    // ==================================================
    // ANTICIPO:
    // crear ABONO aunque todavía no salió el dinero
    // ==================================================

    let movCtaCte = null;

    if (tipo === "anticipo") {

      // Descripción informativa del medio previsto.
      // NO modifica el origen técnico del movimiento.
      const medioDescripcion =
        medio === "caja"
          ? "Caja"
          : "Transferencia/Banco";

      movCtaCte =
        await MovimientoCtaCteProveedor.create(
          {
            proveedor_id:
              Number(proveedor_id),

            empresa_id:
              Number(empresa_id),

            fecha:
              fecha_programada,

            fecha_pago:
              fecha_programada,

            descripcion:
              `Anticipo programado por ${medioDescripcion} #${pago.id} - ${descripcion.trim()}`,

            tipo:
              "abono",

            importe:
              N(monto),

            origen_tipo:
              "PagoProgramadoTesoreria",

            origen_id:
              pago.id,

            comprobanteegreso_id:
              null,

            anulado:
              false,

            ordenpago_id:
              null,

            formapago_id:
              formapago_id
                ? Number(formapago_id)
                : null,

            referencia_tipo:
              "PagoProgramadoTesoreria",

            referencia_id:
              pago.id,
          },

          {
            transaction: t,
          }
        );


      await pago.update(
        {
          movimiento_ctacte_id:
            movCtaCte.id,
        },

        {
          transaction: t,
        }
      );
    }


    await t.commit();


    return res.status(201).json({
      ok: true,

      mensaje:
        tipo === "anticipo"
          ? "Anticipo programado registrado."
          : "Egreso programado registrado.",

      pagoProgramado:
        pago,

      movCtaCte,
    });

  } catch (error) {
    await t.rollback();

    console.error(
      "registrarPagoProgramado:",
      error
    );

    return res.status(400).json({
      error:
        error.message ||
        "No se pudo registrar el pago programado",
    });
  }
};

export const listarPagosProgramados = async (req, res) => {
  try {
    const {
      empresa_id,
      proveedor_id,
      estado,
      medio,
      tipo,
      desde,
      hasta,
    } = req.query || {};

    const where = {};


    if (empresa_id) {
      where.empresa_id =
        Number(empresa_id);
    }

    if (proveedor_id) {
      where.proveedor_id =
        Number(proveedor_id);
    }

    if (estado) {
      where.estado =
        estado;
    }

    if (medio) {
      where.medio =
        medio;
    }

    if (tipo) {
      where.tipo =
        tipo;
    }

    if (desde || hasta) {
      where.fecha_programada = {};

      if (desde) {
        where.fecha_programada[Op.gte] =
          desde;
      }

      if (hasta) {
        where.fecha_programada[Op.lte] =
          hasta;
      }
    }


    const rows =
      await PagoProgramadoTesoreria.findAll({
        where,

        order: [
          ["fecha_programada", "ASC"],
          ["id", "ASC"],
        ],
      });


    return res.json(rows);

  } catch (error) {
    console.error(
      "listarPagosProgramados:",
      error
    );

    return res.status(500).json({
      error:
        "No se pudieron listar los pagos programados",
    });
  }
};

export const acreditarPagoProgramado = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const id =
      Number(req.params.id);

    const {
      fecha_acreditacion,

      // pueden enviarse al momento de acreditar
      caja_id,
      banco_id,
    } = req.body || {};


    const pago =
      await PagoProgramadoTesoreria.findByPk(
        id,
        {
          transaction: t,
          lock: t.LOCK.UPDATE,
        }
      );


    if (!pago) {
      throw new Error(
        "Pago programado no encontrado"
      );
    }


    if (pago.estado !== "pendiente") {
      throw new Error(
        `El pago se encuentra en estado ${pago.estado}`
      );
    }


    const fecha =
      fecha_acreditacion ||
      new Date()
        .toISOString()
        .slice(0, 10);


    // ==================================================
    // ORDEN DE PAGO
    // ==================================================

    let ordenpago_id =
      pago.ordenpago_id || null;


    if (!ordenpago_id) {
      const orden =
        await OrdenPago.create(
          {
            empresa_id:
              pago.empresa_id,

            proveedor_id:
              pago.proveedor_id,

            comprobanteegreso_id:
              pago.comprobanteegreso_id || null,

            fecha,

            total:
              N(pago.monto),

            estado:
              pago.comprobanteegreso_id
                ? "emitida"
                : "pendiente_aplicacion",

            numero:
              null,

            observaciones:
              pago.observaciones || null,

            origen:
              pago.tipo === "anticipo"
                ? `anticipo_programado_${pago.medio}`
                : `egreso_programado_${pago.medio}`,
          },

          {
            transaction: t,
          }
        );

      ordenpago_id =
        orden.id;
    }


    // ==================================================
    // CREAR MOVIMIENTO REAL
    // ==================================================

    let movimiento = null;


    // -------------------------------
    // BANCO
    // -------------------------------

    if (pago.medio === "banco") {
      const bancoFinal =
        banco_id ||
        pago.banco_id;


      if (!bancoFinal) {
        throw new Error(
          "Debe indicar el banco"
        );
      }


      movimiento =
        await MovimientoBancoTesoreria.create(
          {
            empresa_id:
              pago.empresa_id,

            proveedor_id:
              pago.proveedor_id,

            tipo:
              "egreso",

            descripcion:
              pago.descripcion,

            monto:
              N(pago.monto),

            fecha,

            banco_id:
              Number(bancoFinal),

            formapago_id:
              pago.formapago_id || null,

            referencia_id:
              pago.id,

            referencia_tipo:
              "PagoProgramadoTesoreria",

            observaciones:
              pago.observaciones || null,

            anulado:
              false,

            ordenpago_id,

            comprobanteegreso_id:
              pago.comprobanteegreso_id || null,

            categoriaegreso_id:
              pago.categoriaegreso_id || null,

            imputacioncontable_id:
              pago.imputacioncontable_id || null,

            proyecto_id:
              pago.proyecto_id || null,
          },

          {
            transaction: t,
          }
        );
    }


    // -------------------------------
    // CAJA
    // -------------------------------

    if (pago.medio === "caja") {
      const cajaFinal =
        caja_id ||
        pago.caja_id;


      if (!cajaFinal) {
        throw new Error(
          "Debe indicar la caja"
        );
      }


      movimiento =
        await MovimientoCajaTesoreria.create(
          {
            tipo:
              "egreso",

            descripcion:
              pago.descripcion,

            monto:
              N(pago.monto),

            fecha,

            caja_id:
              Number(cajaFinal),

            formapago_id:
              pago.formapago_id || null,

            referencia_id:
              pago.id,

            referencia_tipo:
              "PagoProgramadoTesoreria",

            observaciones:
              pago.observaciones || null,

            anulado:
              false,

            ordenpago_id,

            categoriaegreso_id:
              pago.categoriaegreso_id || null,

            imputacioncontable_id:
              pago.imputacioncontable_id || null,

            proyecto_id:
              pago.proyecto_id || null,

            // Campos que comprobamos que
            // existen físicamente en PostgreSQL
            proveedor_id:
              pago.proveedor_id || null,

            comprobanteegreso_id:
              pago.comprobanteegreso_id || null,
          },

          {
            transaction: t,
          }
        );
    }


    if (!movimiento) {
      throw new Error(
        "No se pudo generar el movimiento financiero"
      );
    }


    // ==================================================
    // SI ERA ANTICIPO:
    // EL ABONO DEJA DE APUNTAR AL PROGRAMADO
    // Y PASA A APUNTAR AL MOVIMIENTO REAL
    // ==================================================

    // ==================================================
    // EGRESO PROGRAMADO DISPONIBLE PARA VARIAS FACTURAS
    // ==================================================

    let nuevoAbonoCtaCte = null;

    if (
      generar_abono_ctacte === true &&
      pago.tipo !== "anticipo"
    ) {

      nuevoAbonoCtaCte =
        await MovimientoCtaCteProveedor.create(
          {
            proveedor_id:
              pago.proveedor_id,

            empresa_id:
              pago.empresa_id,

            fecha,

            fecha_pago:
              fecha,

            descripcion:
              `Pago programado disponible OP #${ordenpago_id}`,

            tipo:
              "abono",

            importe:
              N(pago.monto),

            origen_tipo:
              "OrdenPago",

            origen_id:
              ordenpago_id,

            comprobanteegreso_id:
              null,

            anulado:
              false,

            ordenpago_id,

            referencia_tipo:
              pago.medio === "caja"
                ? "MovimientoCajaTesoreria"
                : "MovimientoBancoTesoreria",

            referencia_id:
              movimiento.id,

            formapago_id:
              pago.formapago_id || null,
          },
          {
            transaction: t,
          }
        );
    }

    if (
      pago.tipo === "anticipo" &&
      pago.movimiento_ctacte_id
    ) {

      await MovimientoCtaCteProveedor.update(
        {
          referencia_tipo:
            pago.medio === "caja"
              ? "MovimientoCajaTesoreria"
              : "MovimientoBancoTesoreria",

          referencia_id:
            movimiento.id,

          ordenpago_id:
            ordenpago_id,

          comprobanteegreso_id:
            pago.comprobanteegreso_id || null,

          formapago_id:
            pago.formapago_id || null,

          fecha_pago:
            fecha,
        },

        {
          where: {
            id:
              pago.movimiento_ctacte_id,

            anulado: {
              [Op.not]: true,
            },
          },

          transaction: t,
        }
      );
    }


    // ==================================================
    // PROGRAMADO → ACREDITADO
    // ==================================================

    await pago.update(
      {
        estado:
          "acreditado",

        fecha_acreditacion:
          fecha,

        ordenpago_id,

        movimiento_tipo:
          pago.medio === "caja"
            ? "MovimientoCajaTesoreria"
            : "MovimientoBancoTesoreria",

        movimiento_id:
          movimiento.id,
      },

      {
        transaction: t,
      }
    );


    // ==================================================
    // RECALCULAR COMPROBANTE
    // ==================================================

    let resultadoComprobante = null;

    if (pago.comprobanteegreso_id) {

      resultadoComprobante =
        await recalcularComprobanteEgreso(
          pago.comprobanteegreso_id,
          t
        );
    }

    await t.commit();


    return res.json({
      ok: true,

      mensaje:
        "Pago programado acreditado correctamente.",

      pagoProgramado:
        pago,

      movimiento,

      comprobante:
        resultadoComprobante,

      abonoCtaCte:
        nuevoAbonoCtaCte,
    });

  } catch (error) {
    await t.rollback();

    console.error(
      "acreditarPagoProgramado:",
      error
    );

    return res.status(400).json({
      error:
        error.message ||
        "No se pudo acreditar el pago programado",
    });
  }
};

export const eliminarPagoProgramado = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const id =
      Number(req.params.id);


    const pago =
      await PagoProgramadoTesoreria.findByPk(
        id,
        {
          transaction: t,
          lock: t.LOCK.UPDATE,
        }
      );


    if (!pago) {
      throw new Error(
        "Pago programado no encontrado"
      );
    }


    if (pago.estado === "anulado") {
      throw new Error(
        "El pago programado ya está anulado"
      );
    }


    /*
     * IMPORTANTE:
     *
     * Esta función solamente elimina compromisos
     * que TODAVÍA NO fueron acreditados.
     *
     * Los acreditados se anulan desde Caja/Banco.
     */
    if (pago.estado === "acreditado") {
      throw new Error(
        "El pago ya fue acreditado. Debe eliminarse/anularse desde el movimiento de Caja o Banco."
      );
    }


    /*
     * Si ya está asociado a un comprobante,
     * no permitimos borrarlo directamente.
     */
    if (pago.comprobanteegreso_id) {
      throw new Error(
        "El pago programado está asociado a un comprobante de egreso. Primero debe desvincularse del comprobante."
      );
    }


    // ==================================================
    // SI ES ANTICIPO
    // ==================================================

    if (
      pago.tipo === "anticipo" &&
      pago.movimiento_ctacte_id
    ) {

      /*
       * Verificar que el abono no haya sido aplicado
       * contra algún cargo.
       */
      const aplicaciones =
        await MovCtaCteProvAplic.count({
          where: {
            abono_id:
              pago.movimiento_ctacte_id,
          },

          transaction: t,
        });


      if (aplicaciones > 0) {
        throw new Error(
          "El anticipo ya fue aplicado en la cuenta corriente. Primero debe anularse esa aplicación."
        );
      }


      /*
       * Anular ABONO de Cta.Cte.
       */
      await MovimientoCtaCteProveedor.update(
        {
          anulado:
            true,
        },

        {
          where: {
            id:
              pago.movimiento_ctacte_id,
          },

          transaction: t,
        }
      );
    }


    // ==================================================
    // ANULAR PROGRAMADO
    // ==================================================

    await pago.update(
      {
        estado:
          "anulado",
      },

      {
        transaction: t,
      }
    );


    await t.commit();


    return res.json({
      ok: true,

      mensaje:
        pago.tipo === "anticipo"
          ? "Pago programado y anticipo de cuenta corriente anulados correctamente."
          : "Pago programado anulado correctamente.",
    });

  } catch (error) {
    await t.rollback();

    console.error(
      "eliminarPagoProgramado:",
      error
    );

    return res.status(400).json({
      error:
        error.message ||
        "No se pudo eliminar el pago programado",
    });
  }
};

