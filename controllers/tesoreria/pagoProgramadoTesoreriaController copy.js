import { Op } from "sequelize";
import { sequelize } from "../../config/database.js";


import PagoTarjetaCredito from "../../models/tesoreria/pagotarjetacredito.js";

import PagoProgramadoTesoreria
  from "../../models/tesoreria/PagoProgramadoTesoreria.js";

import MovCtaCteProvAplic
  from "../../models/tesoreria/movimientoctacteproveedoraplicacion.js";

import MovimientoCtaCteProveedor
  from "../../models/tesoreria/movimientoctacteproveedor.js";

import MovimientoCajaTesoreria
  from "../../models/tesoreria/movimientocajatesoreria.js";

import MovimientoBancoTesoreria
  from "../../models/tesoreria/movimientobancotesoreria.js";

import OrdenPago from "../../models/tesoreria/ordendepago.js";

import ComprobanteEgreso from "../../models/iva/comprobanteegreso.js";
/*
 * IMPORTANTE:
 * Para CategoriaEgreso copiá EXACTAMENTE el import que ya
 * utiliza movimientoCajaTesoreriaController.js.
 */
import CategoriaEgreso
  from "../../models/tesoreria/categoriaEgreso.js";

import {
  recalcularComprobanteEgreso,
} from "./helpers/recalcularComprobanteEgreso.js";

import EcheqEmitido from "../../models/tesoreria/pagoecheq.js";

const N = (value) => Number(value) || 0;

export const registrarPagoProgramado = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const {
      empresa_id,
      proveedor_id,

      // egreso_varios | anticipo
      tipo,

      // caja | banco | echeq
      medio,

      fecha_programada,
      monto,
      descripcion,
      observaciones,

      formapago_id,

      banco_id,
      caja_id,

      // Sólo para la PROMESA de pago mediante eCheq.
      // Todavía NO se crea EcheqEmitido.
      echeq_fecha_vencimiento,

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

    if (!["caja", "banco", "echeq"].includes(medio)) {
      throw new Error(
        "medio debe ser caja, banco o echeq"
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
      ["banco", "echeq"].includes(medio) &&
      !banco_id
    ) {
      throw new Error(
        medio === "echeq"
          ? "banco_id requerido para pagos con eCheq"
          : "banco_id requerido para pagos bancarios"
      );
    }

    if (
      medio === "echeq" &&
      !echeq_fecha_vencimiento
    ) {
      throw new Error(
        "echeq_fecha_vencimiento requerida para pagos con eCheq"
      );
    }

    if (
      medio === "echeq" &&
      echeq_fecha_vencimiento < fecha_programada
    ) {
      throw new Error(
        "La fecha de vencimiento del eCheq no puede ser anterior a la fecha programada"
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

          echeq_fecha_vencimiento:
            medio === "echeq"
              ? echeq_fecha_vencimiento
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
          : medio === "echeq"
            ? "eCheq"
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

export const verificarDuplicadoPagoProgramado = async (req, res) => {
  try {
    const proveedor_id =
      Number(req.query.proveedor_id);

    const monto =
      Number(req.query.monto);

    if (!proveedor_id) {
      return res.status(400).json({
        error: "proveedor_id requerido",
      });
    }

    if (!(monto > 0)) {
      return res.status(400).json({
        error: "monto inválido",
      });
    }

    /*
     * ==================================================
     * REGLA DE COINCIDENCIA
     * ==================================================
     *
     * ÚNICAMENTE:
     *
     * proveedor_id + monto
     *
     * NO se considera:
     * - empresa
     * - fecha
     * - medio
     * - banco
     * - caja
     * - forma de pago
     * ==================================================
     */

    // ==================================================
    // 1. PAGOS PROGRAMADOS
    //    pendientes o acreditados
    // ==================================================

    const programados =
      await PagoProgramadoTesoreria.findAll({
        where: {
          proveedor_id,
          monto,

          estado: {
            [Op.in]: [
              "pendiente",
              "acreditado",
            ],
          },
        },

        order: [
          ["fecha_programada", "DESC"],
          ["id", "DESC"],
        ],
      });


    // ==================================================
    // 2. SEPARAR PENDIENTES Y ACREDITADOS
    // ==================================================

    const pagosProgramados = [];

    const pagosAcreditadosProgramados = [];

    for (const pago of programados) {
      const p = pago.toJSON();

      const detalle = {
        origen:
          "pago_programado",

        id:
          p.id,

        proveedor_id:
          p.proveedor_id,

        empresa_id:
          p.empresa_id,

        tipo:
          p.tipo,

        medio:
          p.medio,

        estado:
          p.estado,

        fecha:
          p.estado === "acreditado"
            ? p.fecha_acreditacion
            : p.fecha_programada,

        fecha_programada:
          p.fecha_programada,

        fecha_acreditacion:
          p.fecha_acreditacion,

        monto:
          Number(p.monto || 0),

        descripcion:
          p.descripcion,

        observaciones:
          p.observaciones,

        banco_id:
          p.banco_id,

        caja_id:
          p.caja_id,

        formapago_id:
          p.formapago_id,

        echeq_fecha_vencimiento:
          p.echeq_fecha_vencimiento,

        ordenpago_id:
          p.ordenpago_id,

        comprobanteegreso_id:
          p.comprobanteegreso_id,

        movimiento_tipo:
          p.movimiento_tipo,

        movimiento_id:
          p.movimiento_id,
      };

      if (p.estado === "pendiente") {
        pagosProgramados.push(
          detalle
        );
      }

      if (p.estado === "acreditado") {
        pagosAcreditadosProgramados.push(
          detalle
        );
      }
    }


    // ==================================================
    // 3. MOVIMIENTOS REALES DIRECTOS
    // ==================================================

    const [
      movimientosCaja,
      movimientosBanco,
      echeqs,
    ] = await Promise.all([

      MovimientoCajaTesoreria.findAll({
        where: {
          proveedor_id,
          monto,
          tipo: "egreso",

          anulado: {
            [Op.not]: true,
          },
        },

        order: [
          ["fecha", "DESC"],
          ["id", "DESC"],
        ],
      }),

      MovimientoBancoTesoreria.findAll({
        where: {
          proveedor_id,
          monto,
          tipo: "egreso",

          anulado: {
            [Op.not]: true,
          },
        },

        order: [
          ["fecha", "DESC"],
          ["id", "DESC"],
        ],
      }),

      EcheqEmitido.findAll({
        where: {
          proveedor_id,

          importe:
            monto,

          anulado: {
            [Op.not]: true,
          },
        },

        order: [
          ["fecha_emision", "DESC"],
          ["id", "DESC"],
        ],
      }),
    ]);


    // ==================================================
    // 4. IDENTIFICAR MOVIMIENTOS QUE YA ESTÁN
    //    REPRESENTADOS POR UN PROGRAMADO ACREDITADO
    // ==================================================

    const movimientosProgramados =
      new Set();

    for (
      const pago
      of pagosAcreditadosProgramados
    ) {
      if (
        pago.movimiento_tipo &&
        pago.movimiento_id
      ) {
        movimientosProgramados.add(
          `${pago.movimiento_tipo}:${Number(
            pago.movimiento_id
          )}`
        );
      }
    }


    // ==================================================
    // 5. AGREGAR PAGOS ACREDITADOS
    // ==================================================

    const pagosAcreditados = [
      ...pagosAcreditadosProgramados,
    ];


    // ------------------------------
    // CAJA
    // ------------------------------

    for (const movimiento of movimientosCaja) {
      const m =
        movimiento.toJSON();

      const clave =
        `MovimientoCajaTesoreria:${Number(
          m.id
        )}`;

      /*
       * Si este movimiento fue generado por un
       * PagoProgramado acreditado, ya está incluido.
       */
      if (
        movimientosProgramados.has(
          clave
        )
      ) {
        continue;
      }

      pagosAcreditados.push({
        origen:
          "caja",

        id:
          m.id,

        proveedor_id:
          m.proveedor_id,

        empresa_id:
          m.empresa_id || null,

        medio:
          "caja",

        estado:
          "acreditado",

        fecha:
          m.fecha,

        monto:
          Number(m.monto || 0),

        descripcion:
          m.descripcion,

        observaciones:
          m.observaciones,

        caja_id:
          m.caja_id,

        banco_id:
          null,

        formapago_id:
          m.formapago_id,

        ordenpago_id:
          m.ordenpago_id,

        comprobanteegreso_id:
          m.comprobanteegreso_id,

        movimiento_tipo:
          "MovimientoCajaTesoreria",

        movimiento_id:
          m.id,
      });
    }


    // ------------------------------
    // BANCO
    // ------------------------------

    for (
      const movimiento
      of movimientosBanco
    ) {
      const m =
        movimiento.toJSON();

      const clave =
        `MovimientoBancoTesoreria:${Number(
          m.id
        )}`;

      if (
        movimientosProgramados.has(
          clave
        )
      ) {
        continue;
      }

      pagosAcreditados.push({
        origen:
          "banco",

        id:
          m.id,

        proveedor_id:
          m.proveedor_id,

        empresa_id:
          m.empresa_id || null,

        medio:
          "banco",

        estado:
          "acreditado",

        fecha:
          m.fecha,

        monto:
          Number(m.monto || 0),

        descripcion:
          m.descripcion,

        observaciones:
          m.observaciones,

        banco_id:
          m.banco_id,

        caja_id:
          null,

        formapago_id:
          m.formapago_id,

        ordenpago_id:
          m.ordenpago_id,

        comprobanteegreso_id:
          m.comprobanteegreso_id,

        movimiento_tipo:
          "MovimientoBancoTesoreria",

        movimiento_id:
          m.id,
      });
    }


    // ------------------------------
    // ECHEQ
    // ------------------------------

    for (const echeq of echeqs) {
      const e =
        echeq.toJSON();

      const clave =
        `EcheqEmitido:${Number(
          e.id
        )}`;

      if (
        movimientosProgramados.has(
          clave
        )
      ) {
        continue;
      }

      pagosAcreditados.push({
        origen:
          "echeq",

        id:
          e.id,

        proveedor_id:
          e.proveedor_id,

        empresa_id:
          e.empresa_id || null,

        medio:
          "echeq",

        /*
         * Conservamos también el estado real
         * del eCheq para mostrarlo en detalle.
         */
        estado:
          e.estado || "emitido",

        fecha:
          e.fecha_emision,

        fecha_vencimiento:
          e.fecha_vencimiento,

        monto:
          Number(e.importe || 0),

        descripcion:
          e.numero_echeq
            ? `eCheq ${e.numero_echeq}`
            : "eCheq",

        observaciones:
          e.observaciones,

        banco_id:
          e.banco_id,

        caja_id:
          null,

        formapago_id:
          e.formapago_id || null,

        numero_echeq:
          e.numero_echeq,

        ordenpago_id:
          e.ordenpago_id,

        comprobanteegreso_id:
          e.comprobanteegreso_id,

        movimiento_tipo:
          "EcheqEmitido",

        movimiento_id:
          e.id,
      });
    }


    // ==================================================
    // 6. ORDENAR ACREDITADOS POR FECHA
    // ==================================================

    pagosAcreditados.sort(
      (a, b) => {
        const fechaA =
          a.fecha || "";

        const fechaB =
          b.fecha || "";

        if (fechaA === fechaB) {
          return (
            Number(b.id || 0) -
            Number(a.id || 0)
          );
        }

        return fechaB.localeCompare(
          fechaA
        );
      }
    );


    // ==================================================
    // 7. RESPUESTA
    // ==================================================

    return res.json({
      hay_coincidencias:
        pagosProgramados.length > 0 ||
        pagosAcreditados.length > 0,

      hay_programados:
        pagosProgramados.length > 0,

      hay_acreditados:
        pagosAcreditados.length > 0,

      cantidad_programados:
        pagosProgramados.length,

      cantidad_acreditados:
        pagosAcreditados.length,

      pagos_programados:
        pagosProgramados,

      pagos_acreditados:
        pagosAcreditados,
    });

  } catch (error) {
    console.error(
      "verificarDuplicadoPagoProgramado:",
      error
    );

    return res.status(500).json({
      error:
        "No se pudo verificar si existen pagos coincidentes",

      detalle:
        error.message,
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

        where.fecha_programada[
          Op.gte
        ] =
          desde;
      }


      if (hasta) {

        where.fecha_programada[
          Op.lte
        ] =
          hasta;
      }
    }


    // ================================================
    // 1) PAGOS PROGRAMADOS
    // ================================================

    const rows =
      await PagoProgramadoTesoreria.findAll({
        where,

        order: [
          [
            "fecha_programada",
            "ASC",
          ],
          [
            "id",
            "ASC",
          ],
        ],
      });


    if (!rows.length) {
      return res.json([]);
    }


    // ================================================
    // 2) IDS DE PAGOS PROGRAMADOS
    // ================================================

    const pagoIds =
      rows.map(
        (p) =>
          Number(p.id)
      );


    // ================================================
    // 3) ABONOS QUE REPRESENTAN ESOS
    //    PAGOS PROGRAMADOS
    //
    // IMPORTANTE:
    // no usamos empresa_id.
    // ================================================

    const abonos =
      await MovimientoCtaCteProveedor.findAll({

        where: {

          referencia_tipo:
            "PagoProgramadoTesoreria",

          referencia_id: {
            [Op.in]:
              pagoIds,
          },
        },

        attributes: [
          "id",
          "referencia_id",
        ],
      });


    if (!abonos.length) {

      return res.json(
        rows.map(
          (p) => ({
            ...p.toJSON(),

            monto_aplicado:
              0,

            tiene_aplicaciones:
              false,

            comprobantes_aplicados:
              [],
          })
        )
      );
    }


    // ================================================
    // 4) MAPA:
    //    ABONO -> PAGO PROGRAMADO
    // ================================================

    const pagoIdPorAbonoId =
      new Map();


    for (const abono of abonos) {

      pagoIdPorAbonoId.set(
        Number(abono.id),
        Number(
          abono.referencia_id
        )
      );
    }


    const abonoIds =
      abonos.map(
        (a) =>
          Number(a.id)
      );


    // ================================================
    // 5) APLICACIONES DE ESOS ABONOS
    // ================================================
    const aplicaciones =
      await MovCtaCteProvAplic.findAll({

        where: {

          abono_id: {
            [Op.in]:
              abonoIds,
          },
        },

        attributes: [
          "abono_id",
          "cargo_id",
          "importe",
        ],
      });

    // ================================================
    // 5.1) CARGOS RELACIONADOS
    // ================================================

    const cargoIds =
      [
        ...new Set(
          aplicaciones
            .map(
              (a) =>
                Number(
                  a.cargo_id
                )
            )
            .filter(Boolean)
        ),
      ];


    const cargos =
      cargoIds.length > 0
        ? await MovimientoCtaCteProveedor.findAll({

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
        })
        : [];


    // ================================================
    // 5.2) MAPA CARGO -> COMPROBANTE
    // ================================================

    const comprobanteIdPorCargoId =
      new Map();


    for (const cargo of cargos) {

      comprobanteIdPorCargoId.set(
        Number(cargo.id),
        cargo.comprobanteegreso_id
          ? Number(
            cargo.comprobanteegreso_id
          )
          : null
      );
    }


    // ================================================
    // 5.3) COMPROBANTES RELACIONADOS
    // ================================================

    const comprobanteIds =
      [
        ...new Set(
          cargos
            .map(
              (cargo) =>
                Number(
                  cargo.comprobanteegreso_id
                )
            )
            .filter(Boolean)
        ),
      ];


    const comprobantes =
      comprobanteIds.length > 0
        ? await ComprobanteEgreso.findAll({

          where: {
            id: {
              [Op.in]:
                comprobanteIds,
            },
          },

          attributes: [
            "id",
            "nrocomprobante",
          ],
        })
        : [];


    // ================================================
    // 5.4) MAPA COMPROBANTE ID -> NÚMERO
    // ================================================

    const nroComprobantePorId =
      new Map();


    for (const comprobante of comprobantes) {

      nroComprobantePorId.set(
        Number(comprobante.id),
        comprobante.nrocomprobante ||
        `#${comprobante.id}`
      );
    }
    // ================================================
    // 6) TOTAL APLICADO Y COMPROBANTES
    //    POR PAGO PROGRAMADO
    // ================================================

    const montoAplicadoPorPago =
      new Map();


    const comprobantesPorPago =
      new Map();


    for (
      const aplicacion
      of aplicaciones
    ) {

      const pagoId =
        pagoIdPorAbonoId.get(
          Number(
            aplicacion.abono_id
          )
        );


      if (!pagoId) {
        continue;
      }


      // ==============================================
      // 6.1) MONTO TOTAL APLICADO
      // ==============================================

      const anterior =
        Number(
          montoAplicadoPorPago.get(
            pagoId
          ) || 0
        );


      montoAplicadoPorPago.set(
        pagoId,
        anterior +
        Number(
          aplicacion.importe ||
          0
        )
      );


      // ==============================================
      // 6.2) COMPROBANTE DE ESTA APLICACIÓN
      // ==============================================

      const comprobanteId =
        comprobanteIdPorCargoId.get(
          Number(
            aplicacion.cargo_id
          )
        );


      if (!comprobanteId) {
        continue;
      }


      // ==============================================
      // 6.3) MAPA DE COMPROBANTES DEL PAGO
      // ==============================================

      if (
        !comprobantesPorPago.has(
          pagoId
        )
      ) {

        comprobantesPorPago.set(
          pagoId,
          new Map()
        );
      }


      const comprobantesPago =
        comprobantesPorPago.get(
          pagoId
        );


      const anteriorComprobante =
        comprobantesPago.get(
          comprobanteId
        );


      /*
       * Si ya existe el comprobante,
       * acumulamos el importe.
       */
      if (anteriorComprobante) {

        anteriorComprobante.importe_aplicado +=
          Number(
            aplicacion.importe ||
            0
          );

      } else {

        /*
         * Primera aplicación encontrada
         * para este comprobante.
         */
        comprobantesPago.set(
          comprobanteId,
          {
            id:
              comprobanteId,

            nrocomprobante:
              nroComprobantePorId.get(
                comprobanteId
              ) ||
              `#${comprobanteId}`,

            importe_aplicado:
              Number(
                aplicacion.importe ||
                0
              ),
          }
        );
      }
    }

    // ================================================
    // 7) RESPUESTA
    // ================================================

    const resultado =
      rows.map(
        (p) => {

          const montoAplicado =
            Number(
              montoAplicadoPorPago.get(
                Number(p.id)
              ) || 0
            );

          const comprobantesAplicados =
            [
              ...(
                comprobantesPorPago.get(
                  Number(p.id)
                )?.values() ||
                []
              ),
            ];


          return {

            ...p.toJSON(),

            monto_aplicado:
              montoAplicado,

            tiene_aplicaciones:
              montoAplicado > 0,

            comprobantes_aplicados:
              comprobantesAplicados,
          };
        }
      );


    return res.json(
      resultado
    );


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

      // Datos que pueden ajustarse
      // justo antes de acreditar
      medio,
      caja_id,
      banco_id,
      monto,
      formapago_id,
      descripcion,
      observaciones,
      proyecto_id,

      // Datos definitivos del eCheq.
      // Sólo se utilizan si medio === "echeq".
      echeq_fecha_vencimiento,
      numero_echeq,

      generar_abono_ctacte = false,

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
    // ==================================================
    // DATOS FINALES DE ACREDITACIÓN
    // ==================================================

    const medioFinal =
      medio ||
      pago.medio;


    if (
      !["caja", "banco", "echeq"].includes(
        medioFinal
      )
    ) {
      throw new Error(
        "Medio de pago inválido"
      );
    }


    const montoFinal =
      monto !== undefined &&
        monto !== null &&
        monto !== ""
        ? N(monto)
        : N(pago.monto);


    if (!(montoFinal > 0)) {
      throw new Error(
        "El monto debe ser mayor a cero"
      );
    }


    const descripcionFinal =
      descripcion !== undefined
        ? String(descripcion).trim()
        : String(
          pago.descripcion || ""
        ).trim();


    if (!descripcionFinal) {
      throw new Error(
        "La descripción es requerida"
      );
    }


    const observacionesFinal =
      observaciones !== undefined
        ? (
          String(observaciones).trim() ||
          null
        )
        : pago.observaciones;


    const proyectoFinal =
      proyecto_id !== undefined
        ? (
          proyecto_id
            ? Number(proyecto_id)
            : null
        )
        : pago.proyecto_id;

    const formaPagoFinal =
      formapago_id !== undefined &&
        formapago_id !== null &&
        formapago_id !== ""
        ? Number(
          formapago_id
        )
        : pago.formapago_id;


    if (!formaPagoFinal) {
      throw new Error(
        "Debe indicar la forma de pago"
      );
    }

    const formaPagoDescripcion =
      medioFinal === "caja"
        ? "Efectivo"
        : medioFinal === "echeq"
          ? "eCheq"
          : "Transferencia/Banco";

    const fecha =
      fecha_acreditacion ||
      new Date()
        .toISOString()
        .slice(0, 10);

    // ==================================================
    // DATOS DEFINITIVOS DEL ECHEQ
    // ==================================================

    let bancoEcheqFinal = null;
    let fechaVencimientoEcheqFinal = null;
    let numeroEcheqFinal = null;


    if (medioFinal === "echeq") {

      bancoEcheqFinal =
        banco_id ||
        pago.banco_id;


      if (!bancoEcheqFinal) {
        throw new Error(
          "Debe indicar el banco del eCheq"
        );
      }


      fechaVencimientoEcheqFinal =
        echeq_fecha_vencimiento ||
        pago.echeq_fecha_vencimiento;


      if (!fechaVencimientoEcheqFinal) {
        throw new Error(
          "Debe indicar la fecha de vencimiento del eCheq"
        );
      }


      if (
        fechaVencimientoEcheqFinal <
        fecha
      ) {
        throw new Error(
          "La fecha de vencimiento del eCheq no puede ser anterior a la fecha de emisión"
        );
      }


      numeroEcheqFinal =
        numero_echeq !== undefined &&
          numero_echeq !== null &&
          String(numero_echeq).trim()
          ? String(numero_echeq).trim()
          : null;
    }
    // ===============
    // ===================================
    // VALIDAR ANTICIPO YA APLICADO A FACTURAS
    // ==================================================

    if (
      pago.tipo === "anticipo" &&
      pago.movimiento_ctacte_id
    ) {

      const totalAplicadoRaw =
        await MovCtaCteProvAplic.sum(
          "importe",
          {
            where: {
              abono_id:
                pago.movimiento_ctacte_id,
            },

            transaction:
              t,
          }
        );


      const totalAplicado =
        N(totalAplicadoRaw);


      if (
        montoFinal < totalAplicado
      ) {

        throw new Error(
          `No se puede acreditar el anticipo por $${montoFinal.toLocaleString("es-AR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })} porque ya tiene $${totalAplicado.toLocaleString("es-AR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })} aplicados a facturas.`
        );
      }
    }
    // ==================================================
    // ORDEN DE PAGO
    // ==================================================

    /*
     * Guardamos la OP original del compromiso.
     *
     * Si el PagoProgramado está vinculado a un comprobante,
     * más abajo utilizaremos la OP del comprobante.
     *
     * Al final podremos determinar si esta OP original
     * quedó realmente sin referencias y puede eliminarse.
     */
    const ordenpagoOriginalId =
      pago.ordenpago_id
        ? Number(pago.ordenpago_id)
        : null;


    let ordenpago_id = null;

    /*
     * ==================================================
     * 1) SI ESTÁ VINCULADO A UN COMPROBANTE
     * ==================================================
     *
     * La OrdenPago principal debe ser la del comprobante.
     *
     * El PagoProgramado pudo haber sido creado antes y tener
     * su propia OP, pero una vez materializado como pago de
     * un comprobante, el movimiento financiero real debe
     * quedar asociado a la OP de ese comprobante.
     * ==================================================
     */

    if (pago.comprobanteegreso_id) {

      const comprobanteVinculado =
        await ComprobanteEgreso.findByPk(
          pago.comprobanteegreso_id,
          {
            transaction: t,
            lock: t.LOCK.UPDATE,
          }
        );


      if (!comprobanteVinculado) {
        throw new Error(
          `No se encontró el comprobante vinculado #${pago.comprobanteegreso_id}`
        );
      }


      /*
       * Defensa de empresa.
       */
      if (
        comprobanteVinculado.empresa_id &&
        Number(comprobanteVinculado.empresa_id) !==
        Number(pago.empresa_id)
      ) {
        throw new Error(
          "El comprobante vinculado pertenece a otra empresa"
        );
      }


      /*
       * Defensa de proveedor.
       */
      if (
        comprobanteVinculado.proveedor_id &&
        pago.proveedor_id &&
        Number(comprobanteVinculado.proveedor_id) !==
        Number(pago.proveedor_id)
      ) {
        throw new Error(
          "El comprobante vinculado pertenece a otro proveedor"
        );
      }


      /*
       * Un comprobante emitido debería tener OP.
       *
       * Si no la tiene, no reutilizamos silenciosamente la OP
       * vieja del programado porque dejaríamos inconsistente
       * el circuito del comprobante.
       */
      if (!comprobanteVinculado.ordenpago_id) {
        throw new Error(
          `El comprobante vinculado #${comprobanteVinculado.id} no tiene Orden de Pago`
        );
      }


      const ordenComprobante =
        await OrdenPago.findByPk(
          comprobanteVinculado.ordenpago_id,
          {
            transaction: t,
            lock: t.LOCK.UPDATE,
          }
        );


      if (!ordenComprobante) {
        throw new Error(
          `No se encontró la Orden de Pago #${comprobanteVinculado.ordenpago_id} del comprobante`
        );
      }


      if (
        Number(ordenComprobante.empresa_id) !==
        Number(pago.empresa_id)
      ) {
        throw new Error(
          "La Orden de Pago del comprobante pertenece a otra empresa"
        );
      }


      if (
        ordenComprobante.proveedor_id &&
        pago.proveedor_id &&
        Number(ordenComprobante.proveedor_id) !==
        Number(pago.proveedor_id)
      ) {
        throw new Error(
          "La Orden de Pago del comprobante pertenece a otro proveedor"
        );
      }


      ordenpago_id =
        ordenComprobante.id;
    }


    /*
     * ==================================================
     * 2) SI NO ESTÁ VINCULADO A COMPROBANTE
     * ==================================================
     *
     * Conservamos la OP propia que ya tenía el compromiso.
     * ==================================================
     */

    if (
      !pago.comprobanteegreso_id &&
      pago.ordenpago_id
    ) {

      const ordenProgramado =
        await OrdenPago.findByPk(
          pago.ordenpago_id,
          {
            transaction: t,
            lock: t.LOCK.UPDATE,
          }
        );


      if (!ordenProgramado) {
        throw new Error(
          `No se encontró la Orden de Pago #${pago.ordenpago_id} del pago programado`
        );
      }


      if (
        Number(ordenProgramado.empresa_id) !==
        Number(pago.empresa_id)
      ) {
        throw new Error(
          "La Orden de Pago del pago programado pertenece a otra empresa"
        );
      }


      if (
        ordenProgramado.proveedor_id &&
        pago.proveedor_id &&
        Number(ordenProgramado.proveedor_id) !==
        Number(pago.proveedor_id)
      ) {
        throw new Error(
          "La Orden de Pago del pago programado pertenece a otro proveedor"
        );
      }


      ordenpago_id =
        ordenProgramado.id;
    }


    /*
     * ==================================================
     * 3) SI TODAVÍA NO EXISTE OP
     * ==================================================
     *
     * Esto corresponde principalmente a un programado
     * independiente que por algún motivo todavía no tiene OP.
     * ==================================================
     */

    if (!ordenpago_id) {

      const orden =
        await OrdenPago.create(
          {
            empresa_id:
              pago.empresa_id,

            proveedor_id:
              pago.proveedor_id,

            comprobanteegreso_id:
              null,

            fecha,

            total:
              montoFinal,

            estado:
              "pendiente_aplicacion",

            numero:
              null,

            observaciones:
              observacionesFinal,

            origen:
              pago.tipo === "anticipo"
                ? `anticipo_programado_${medioFinal}`
                : `egreso_programado_${medioFinal}`,
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

    if (medioFinal === "banco") {
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
              descripcionFinal,

            monto:
              montoFinal,

            fecha,

            banco_id:
              Number(bancoFinal),

            formapago_id:
              formaPagoFinal,

            referencia_id:
              pago.id,

            referencia_tipo:
              "PagoProgramadoTesoreria",

            observaciones:
              observacionesFinal,

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
              proyectoFinal,
          },

          {
            transaction: t,
          }
        );
    }


    // -------------------------------
    // CAJA
    // -------------------------------

    if (medioFinal === "caja") {
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
              descripcionFinal,

            monto:
              montoFinal,

            fecha,

            caja_id:
              Number(cajaFinal),

            formapago_id:
              formaPagoFinal,

            referencia_id:
              pago.id,

            referencia_tipo:
              "PagoProgramadoTesoreria",

            observaciones:
              observacionesFinal,

            anulado:
              false,

            ordenpago_id,

            categoriaegreso_id:
              pago.categoriaegreso_id || null,

            imputacioncontable_id:
              pago.imputacioncontable_id || null,

            proyecto_id:
              proyectoFinal,

            // Campos que comprobamos que
            // existen físicamente en PostgreSQL
            proveedor_id:
              pago.proveedor_id || null,

            comprobanteegreso_id:
              pago.comprobanteegreso_id || null,
            fecha_recepcion: fecha,
          },

          {
            transaction: t,
          }
        );
    }

    // -------------------------------
    // ECHEQ
    // -------------------------------

    if (medioFinal === "echeq") {

      movimiento =
        await EcheqEmitido.create(
          {
            comprobanteegreso_id:
              pago.comprobanteegreso_id || null,

            proveedor_id:
              pago.proveedor_id,

            empresa_id:
              pago.empresa_id,

            numero_echeq:
              numeroEcheqFinal,

            banco_id:
              Number(bancoEcheqFinal),

            fecha_emision:
              fecha,

            fecha_vencimiento:
              fechaVencimientoEcheqFinal,

            importe:
              montoFinal,

            estado:
              "emitido",

            anulado:
              false,

            ordenpago_id,

            categoriaegreso_id:
              pago.categoriaegreso_id || null,

            imputacioncontable_id:
              pago.imputacioncontable_id || null,

            proyecto_id:
              proyectoFinal,

            referencia_id:
              pago.id,

            referencia_tipo:
              "PagoProgramadoTesoreria",
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
              montoFinal,

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
              medioFinal === "caja"
                ? "MovimientoCajaTesoreria"
                : medioFinal === "echeq"
                  ? "EcheqEmitido"
                  : "MovimientoBancoTesoreria",

            referencia_id:
              movimiento.id,

            formapago_id:
              formaPagoFinal,
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
            medioFinal === "caja"
              ? "MovimientoCajaTesoreria"
              : medioFinal === "echeq"
                ? "EcheqEmitido"
                : "MovimientoBancoTesoreria",

          referencia_id:
            movimiento.id,

          ordenpago_id,

          comprobanteegreso_id:
            pago.comprobanteegreso_id ||
            null,

          formapago_id:
            formaPagoFinal,

          fecha:
            fecha,

          fecha_pago:
            fecha,

          importe:
            montoFinal,

          descripcion:
            `Anticipo acreditado OP #${ordenpago_id} - ${descripcionFinal} · Pago con: ${formaPagoDescripcion}`,
        },

        {
          where: {
            id:
              pago.movimiento_ctacte_id,

            anulado: {
              [Op.not]: true,
            },
          },

          transaction:
            t,
        }
      );
    }

    // ==================================================
    // ABONOS QUE REPRESENTABAN ESTE PAGO PROGRAMADO
    // ==================================================
    /*
     * Un PagoProgramado puede haber sido utilizado como
     * abono de Cta.Cte. y aplicado a una o varias facturas.
     *
     * Mientras está pendiente, esos abonos apuntan a:
     *
     *   PagoProgramadoTesoreria -> pago.id
     *
     * Al acreditarlo deben dejar de representar solamente
     * un compromiso y pasar a apuntar al movimiento
     * financiero REAL que acabamos de crear.
     */

    const tipoMovimientoReal =
      medioFinal === "caja"
        ? "MovimientoCajaTesoreria"
        : medioFinal === "echeq"
          ? "EcheqEmitido"
          : "MovimientoBancoTesoreria";


    const abonosProgramado =
      await MovimientoCtaCteProveedor.findAll({
        where: {
          tipo: "abono",

          referencia_tipo:
            "PagoProgramadoTesoreria",

          referencia_id:
            pago.id,

          anulado: {
            [Op.not]: true,
          },
        },

        transaction: t,
        lock: t.LOCK.UPDATE,
      });


    for (const abono of abonosProgramado) {

      await abono.update(
        {
          referencia_tipo:
            tipoMovimientoReal,

          referencia_id:
            movimiento.id,

          ordenpago_id,

          formapago_id:
            formaPagoFinal,

          fecha_pago:
            fecha,

          descripcion:
            `Pago programado acreditado OP #${ordenpago_id} - ${descripcionFinal} · Pago con: ${formaPagoDescripcion}`,
        },
        {
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

        // Datos definitivos
        medio:
          medioFinal,

        monto:
          montoFinal,

        formapago_id:
          formaPagoFinal,

        descripcion:
          descripcionFinal,

        observaciones:
          observacionesFinal,

        proyecto_id:
          proyectoFinal,

        banco_id:
          (
            medioFinal === "banco" ||
            medioFinal === "echeq"
          )
            ? Number(
              banco_id ||
              pago.banco_id
            )
            : null,

        caja_id:
          medioFinal === "caja"
            ? Number(
              caja_id ||
              pago.caja_id
            )
            : null,

        echeq_fecha_vencimiento:
          medioFinal === "echeq"
            ? fechaVencimientoEcheqFinal
            : null,

        ordenpago_id,

        movimiento_tipo:
          medioFinal === "caja"
            ? "MovimientoCajaTesoreria"
            : medioFinal === "echeq"
              ? "EcheqEmitido"
              : "MovimientoBancoTesoreria",

        movimiento_id:
          movimiento.id,
      },

      {
        transaction: t,
      }
    );

    // ==================================================
    // LIMPIAR OP ORIGINAL DEL PAGO PROGRAMADO
    // ==================================================
    /*
     * Si al acreditar un PagoProgramado vinculado a un
     * comprobante pasamos de su OP original a la OP propia
     * del comprobante, la OP anterior puede haber quedado
     * huérfana.
     *
     * Sólo la eliminamos si:
     *
     * 1) realmente cambió la OP;
     * 2) no pertenece a otro comprobante;
     * 3) no tiene movimientos financieros;
     * 4) no tiene movimientos de cuenta corriente;
     * 5) no tiene eCheqs;
     *
     * Nunca hacemos destroy() de una OP con referencias.
     */

    if (
      ordenpagoOriginalId &&
      Number(ordenpagoOriginalId) !==
      Number(ordenpago_id)
    ) {

      const ordenOriginal =
        await OrdenPago.findByPk(
          ordenpagoOriginalId,
          {
            transaction: t,
            lock: t.LOCK.UPDATE,
          }
        );


      if (ordenOriginal) {

        /*
         * Una OP perteneciente a otro comprobante
         * nunca debe eliminarse automáticamente.
         */
        const tieneComprobante =
          Boolean(
            ordenOriginal.comprobanteegreso_id
          );


        const movCaja =
          await MovimientoCajaTesoreria.findOne({
            where: {
              ordenpago_id:
                ordenpagoOriginalId,

              anulado: {
                [Op.not]:
                  true,
              },
            },

            transaction:
              t,

            lock:
              t.LOCK.UPDATE,
          });


        const movBanco =
          await MovimientoBancoTesoreria.findOne({
            where: {
              ordenpago_id:
                ordenpagoOriginalId,

              anulado: {
                [Op.not]:
                  true,
              },
            },

            transaction:
              t,

            lock:
              t.LOCK.UPDATE,
          });


        const movCtaCte =
          await MovimientoCtaCteProveedor.findOne({
            where: {
              ordenpago_id:
                ordenpagoOriginalId,

              anulado: {
                [Op.not]:
                  true,
              },
            },

            transaction:
              t,

            lock:
              t.LOCK.UPDATE,
          });


        const echeq =
          await EcheqEmitido.findOne({
            where: {
              ordenpago_id:
                ordenpagoOriginalId,

              anulado: {
                [Op.not]:
                  true,
              },
            },

            transaction:
              t,

            lock:
              t.LOCK.UPDATE,
          });

        const pagoTarjeta =
          await PagoTarjetaCredito.findOne({
            where: {
              ordenpago_id:
                ordenpagoOriginalId,

              anulado: {
                [Op.not]:
                  true,
              },
            },

            transaction:
              t,

            lock:
              t.LOCK.UPDATE,
          });

        const otroPagoProgramado =
          await PagoProgramadoTesoreria.findOne({
            where: {
              ordenpago_id:
                ordenpagoOriginalId,

              id: {
                [Op.ne]:
                  pago.id,
              },

              estado: {
                [Op.notIn]: [
                  "anulado",
                ],
              },
            },

            transaction:
              t,

            lock:
              t.LOCK.UPDATE,
          });

        /*
         * Si no quedó absolutamente ninguna referencia
         * activa, la OP original ya no representa ninguna
         * operación y puede eliminarse.
         */
        if (
          !tieneComprobante &&
          !movCaja &&
          !movBanco &&
          !movCtaCte &&
          !echeq &&
          !pagoTarjeta &&
          !otroPagoProgramado

        ) {

          await ordenOriginal.destroy({
            transaction: t,
          });
        }
      }
    }

    // ==================================================
    // RECALCULAR COMPROBANTES AFECTADOS
    // ==================================================

    let resultadoComprobante = null;


    /*
     * Un PagoProgramado puede estar:
     *
     * 1) vinculado directamente a un comprobante; o
     *
     * 2) aplicado mediante un ABONO de Cta.Cte.
     *    a uno o VARIOS comprobantes.
     *
     * Por eso no alcanza con mirar solamente
     * pago.comprobanteegreso_id.
     */

    const comprobantesAfectados =
      new Set();


    /*
     * Asociación directa.
     */
    if (pago.comprobanteegreso_id) {

      comprobantesAfectados.add(
        Number(
          pago.comprobanteegreso_id
        )
      );
    }


    /*
     * Asociaciones realizadas mediante los abonos
     * que pertenecían a este PagoProgramado.
     */
    const idsAbonosProgramado =
      abonosProgramado
        .map(
          (abono) =>
            Number(abono.id)
        )
        .filter(Boolean);


    if (idsAbonosProgramado.length > 0) {

      const aplicacionesProgramado =
        await MovCtaCteProvAplic.findAll({
          where: {
            abono_id: {
              [Op.in]:
                idsAbonosProgramado,
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
            aplicacionesProgramado
              .map(
                (aplicacion) =>
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
                [Op.not]: true,
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


    /*
     * Ahora sí recalculamos TODOS los comprobantes
     * afectados por la acreditación.
     */
    const resultadosComprobantes = [];


    for (
      const comprobanteId
      of comprobantesAfectados
    ) {

      const resultado =
        await recalcularComprobanteEgreso(
          comprobanteId,
          t
        );


      resultadosComprobantes.push(
        resultado
      );
    }


    /*
     * Conservamos la respuesta anterior para no romper
     * el frontend que eventualmente utilice
     * response.comprobante.
     */
    if (
      resultadosComprobantes.length === 1
    ) {

      resultadoComprobante =
        resultadosComprobantes[0];

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


    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      throw new Error(
        "ID de pago programado inválido"
      );
    }


    // ============================================================
    // 1. BUSCAR Y BLOQUEAR PAGO PROGRAMADO
    // ============================================================

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


    if (
      pago.estado === "anulado"
    ) {
      throw new Error(
        "El pago programado ya está anulado"
      );
    }


    /*
     * Los programados acreditados ya poseen
     * movimiento financiero real.
     *
     * Se revierten desde Caja/Banco/eCheq.
     */
    if (
      pago.estado === "acreditado"
    ) {
      throw new Error(
        "El pago ya fue acreditado. Debe anularse desde el movimiento financiero que lo originó (Caja, Banco o eCheq)."
      );
    }


    // ============================================================
    // 2. COMPROBANTES QUE DEBEREMOS RECALCULAR
    // ============================================================

    const comprobantesARecalcular =
      new Set();


    if (
      pago.comprobanteegreso_id
    ) {
      comprobantesARecalcular.add(
        Number(
          pago.comprobanteegreso_id
        )
      );
    }


    // ============================================================
    // 3. EGRESO PROGRAMADO UTILIZADO EN CUENTA CORRIENTE
    //
    // Cuando aplicarAbonoCtaCteProveedor utiliza un
    // PagoProgramado existente, el ABONO queda:
    //
    // referencia_tipo = "PagoProgramadoTesoreria"
    // referencia_id   = pago.id
    //
    // NO existe todavía movimiento financiero real.
    // ============================================================

    if (
      pago.tipo !== "anticipo"
    ) {

      const abonosProgramado =
        await MovimientoCtaCteProveedor.findAll({
          where: {
            proveedor_id:
              pago.proveedor_id,

            tipo:
              "abono",

            referencia_tipo:
              "PagoProgramadoTesoreria",

            referencia_id:
              pago.id,

            anulado: {
              [Op.not]:
                true,
            },
          },

          transaction: t,
          lock: t.LOCK.UPDATE,
        });


      for (
        const abono
        of abonosProgramado
      ) {

        // ========================================================
        // 3.1 OBTENER APLICACIONES DEL ABONO
        // ========================================================

        const aplicaciones =
          await MovCtaCteProvAplic.findAll({
            where: {
              abono_id:
                abono.id,
            },

            transaction: t,
            lock: t.LOCK.UPDATE,
          });


        // ========================================================
        // 3.2 IDENTIFICAR COMPROBANTES AFECTADOS
        // ========================================================

        const cargoIds =
          [
            ...new Set(
              aplicaciones
                .map(
                  a =>
                    Number(
                      a.cargo_id
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

                proveedor_id:
                  pago.proveedor_id,

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
              lock: t.LOCK.UPDATE,
            });


          for (
            const cargo
            of cargos
          ) {

            if (
              cargo.comprobanteegreso_id
            ) {

              comprobantesARecalcular.add(
                Number(
                  cargo.comprobanteegreso_id
                )
              );
            }
          }
        }


        /*
         * El ABONO también puede tener una referencia
         * directa al comprobante.
         */
        if (
          abono.comprobanteegreso_id
        ) {

          comprobantesARecalcular.add(
            Number(
              abono.comprobanteegreso_id
            )
          );
        }


        // ========================================================
        // 3.3 ELIMINAR APLICACIONES
        //
        // Al eliminar estas filas, el cargo original recupera
        // automáticamente su saldo pendiente.
        // ========================================================

        if (
          aplicaciones.length > 0
        ) {

          await MovCtaCteProvAplic.destroy({
            where: {
              abono_id:
                abono.id,
            },

            transaction: t,
          });
        }


        // ========================================================
        // 3.4 ANULAR ABONO GENERADO POR EL PROGRAMADO
        // ========================================================

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
    }


    // ============================================================
    // 4. ANTICIPO PROGRAMADO
    //
    // Este caso mantiene su lógica propia porque el ABONO se
    // crea al registrar el anticipo.
    // ============================================================

    if (
      pago.tipo === "anticipo" &&
      pago.movimiento_ctacte_id
    ) {

      const abonoAnticipo =
        await MovimientoCtaCteProveedor.findByPk(
          pago.movimiento_ctacte_id,
          {
            transaction: t,
            lock: t.LOCK.UPDATE,
          }
        );


      if (abonoAnticipo) {

        const aplicacionesAnticipo =
          await MovCtaCteProvAplic.findAll({
            where: {
              abono_id:
                abonoAnticipo.id,
            },

            transaction: t,
            lock: t.LOCK.UPDATE,
          });


        /*
         * Conservamos la regla actual:
         * un anticipo ya aplicado debe primero desaplicarse
         * desde su propio circuito.
         */
        if (
          aplicacionesAnticipo.length > 0
        ) {
          throw new Error(
            "El anticipo ya fue aplicado en la cuenta corriente. Primero debe anularse esa aplicación."
          );
        }


        if (
          abonoAnticipo.comprobanteegreso_id
        ) {

          comprobantesARecalcular.add(
            Number(
              abonoAnticipo.comprobanteegreso_id
            )
          );
        }


        await abonoAnticipo.update(
          {
            anulado:
              true,
          },
          {
            transaction: t,
          }
        );
      }
    }


    // ============================================================
    // 5. DESVINCULAR DEL COMPROBANTE
    //
    // Ya eliminamos primero el efecto de Cta.Cte.
    // ============================================================

    await pago.update(
      {
        comprobanteegreso_id:
          null,
      },
      {
        transaction: t,
      }
    );


    // ============================================================
    // 6. ANULAR ORDEN DE PAGO DEL PROGRAMADO
    // ============================================================

    if (
      pago.ordenpago_id
    ) {

      const orden =
        await OrdenPago.findByPk(
          pago.ordenpago_id,
          {
            transaction: t,
            lock: t.LOCK.UPDATE,
          }
        );


      if (orden) {

        /*
         * Sólo anulamos una OP que no pertenezca
         * directamente a un comprobante.
         */
        if (
          !orden.comprobanteegreso_id
        ) {

          await orden.update(
            {
              estado:
                "anulada",
            },
            {
              transaction: t,
            }
          );
        }
      }
    }


    // ============================================================
    // 7. ANULAR PAGO PROGRAMADO
    // ============================================================

    await pago.update(
      {
        estado:
          "anulado",

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
    // 8. RECALCULAR COMPROBANTES
    //
    // El helper central contempla aplicaciones de Cta.Cte.
    // Una vez eliminadas, recuperará saldo y estado.
    // ============================================================

    const comprobantesActualizados =
      [];


    for (
      const compId
      of comprobantesARecalcular
    ) {

      if (!compId) {
        continue;
      }


      const resultado =
        await recalcularComprobanteEgreso(
          compId,
          t
        );


      if (resultado) {

        comprobantesActualizados.push({
          comprobante_id:
            compId,

          saldo:
            resultado.saldo,

          estado:
            resultado.estado,
        });
      }
    }


    await t.commit();


    return res.json({
      ok:
        true,

      mensaje:
        pago.tipo === "anticipo"
          ? "Pago programado y anticipo anulados correctamente."
          : "Pago programado anulado y su aplicación en cuenta corriente revertida correctamente.",

      pagoProgramado_id:
        pago.id,

      comprobantes:
        comprobantesActualizados,
    });

  } catch (error) {

    if (!t.finished) {
      await t.rollback();
    }


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

export const actualizarPagoProgramado = async (req, res) => {

  const t =
    await sequelize.transaction();


  try {

    const id =
      Number(req.params.id);


    const {
      fecha_programada,
      medio,
      formapago_id,
      caja_id,
      banco_id,
      echeq_fecha_vencimiento,
      monto,
      descripcion,
      observaciones,
      categoriaegreso_id,
      proyecto_id,
    } = req.body || {};


    // ==================================================
    // BUSCAR Y BLOQUEAR PAGO PROGRAMADO
    // ==================================================

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
        "Sólo se pueden modificar pagos programados pendientes"
      );
    }


    // ==================================================
    // VALORES FINALES
    // ==================================================

    const fechaFinal =
      fecha_programada ||
      pago.fecha_programada;


    if (!fechaFinal) {
      throw new Error(
        "La fecha programada es requerida"
      );
    }


    const medioFinal =
      medio ||
      pago.medio;


    if (
      !["caja", "banco", "echeq"].includes(
        medioFinal
      )
    ) {
      throw new Error(
        "Medio de pago inválido"
      );
    }


    const montoFinal =
      monto !== undefined &&
        monto !== null &&
        monto !== ""
        ? N(monto)
        : N(pago.monto);


    if (!(montoFinal > 0)) {
      throw new Error(
        "El monto debe ser mayor a cero"
      );
    }


    const descripcionFinal =
      descripcion !== undefined
        ? String(
          descripcion
        ).trim()
        : String(
          pago.descripcion || ""
        ).trim();


    if (!descripcionFinal) {
      throw new Error(
        "La descripción es requerida"
      );
    }


    const observacionesFinal =
      observaciones !== undefined
        ? (
          String(
            observaciones || ""
          ).trim() ||
          null
        )
        : pago.observaciones;


    const proyectoFinal =
      proyecto_id !== undefined
        ? (
          proyecto_id
            ? Number(
              proyecto_id
            )
            : null
        )
        : pago.proyecto_id;


    const formaPagoFinal =
      formapago_id !== undefined &&
        formapago_id !== null &&
        formapago_id !== ""
        ? Number(
          formapago_id
        )
        : Number(
          pago.formapago_id
        );


    if (!formaPagoFinal) {
      throw new Error(
        "Debe indicar la forma de pago"
      );
    }


    // ==================================================
    // CATEGORÍA + IMPUTACIÓN CONTABLE
    // ==================================================

    const categoriaFinal =
      categoriaegreso_id !== undefined &&
        categoriaegreso_id !== null &&
        categoriaegreso_id !== ""
        ? Number(
          categoriaegreso_id
        )
        : Number(
          pago.categoriaegreso_id
        );


    if (!categoriaFinal) {
      throw new Error(
        "Debe indicar la categoría de egreso"
      );
    }


    const categoria =
      await CategoriaEgreso.findByPk(
        categoriaFinal,
        {
          transaction: t,
        }
      );


    if (!categoria) {
      throw new Error(
        "La categoría indicada no existe"
      );
    }


    if (
      !categoria.imputacioncontable_id
    ) {
      throw new Error(
        "La categoría no tiene imputación contable asociada"
      );
    }


    const imputacionFinal =
      Number(
        categoria.imputacioncontable_id
      );

    // ==================================================
    // CAJA / BANCO DEFINITIVOS
    // ==================================================

    let bancoFinal =
      null;

    let cajaFinal =
      null;

    if (
      medioFinal === "banco" ||
      medioFinal === "echeq"
    ) {

      bancoFinal =
        banco_id
          ? Number(banco_id)
          : (
            (
              pago.medio === "banco" ||
              pago.medio === "echeq"
            ) &&
              pago.banco_id
              ? Number(pago.banco_id)
              : null
          );


      if (!bancoFinal) {
        throw new Error(
          medioFinal === "echeq"
            ? "Debe indicar el banco del eCheq"
            : "Debe indicar el banco"
        );
      }
    }



    if (medioFinal === "caja") {

      cajaFinal =
        caja_id
          ? Number(
            caja_id
          )
          : (
            pago.medio === "caja" &&
              pago.caja_id
              ? Number(
                pago.caja_id
              )
              : null
          );


      if (!cajaFinal) {
        throw new Error(
          "Debe indicar la caja"
        );
      }
    }

    const echeqFechaVencimientoFinal =
      medioFinal === "echeq"
        ? (
          echeq_fecha_vencimiento ||
          (
            pago.medio === "echeq"
              ? pago.echeq_fecha_vencimiento
              : null
          )
        )
        : null;


    if (
      medioFinal === "echeq" &&
      !echeqFechaVencimientoFinal
    ) {
      throw new Error(
        "Debe indicar la fecha de vencimiento prevista del eCheq"
      );
    }


    if (
      medioFinal === "echeq" &&
      echeqFechaVencimientoFinal < fechaFinal
    ) {
      throw new Error(
        "La fecha de vencimiento del eCheq no puede ser anterior a la fecha programada"
      );
    }
    // ==================================================
    // ANTICIPO:
    // NO PERMITIR MONTO MENOR A LO YA APLICADO
    // ==================================================

    let movCtaCte =
      null;


    if (
      pago.tipo === "anticipo"
    ) {

      if (
        !pago.movimiento_ctacte_id
      ) {
        throw new Error(
          "El anticipo programado no tiene asociado su movimiento de cuenta corriente"
        );
      }


      movCtaCte =
        await MovimientoCtaCteProveedor.findByPk(
          pago.movimiento_ctacte_id,
          {
            transaction: t,
            lock: t.LOCK.UPDATE,
          }
        );


      if (!movCtaCte) {
        throw new Error(
          "No se encontró el anticipo asociado en la cuenta corriente del proveedor"
        );
      }


      if (movCtaCte.anulado) {
        throw new Error(
          "El anticipo asociado en cuenta corriente se encuentra anulado"
        );
      }


      const totalAplicadoRaw =
        await MovCtaCteProvAplic.sum(
          "importe",
          {
            where: {
              abono_id:
                pago.movimiento_ctacte_id,
            },

            transaction:
              t,
          }
        );


      const totalAplicado =
        N(
          totalAplicadoRaw
        );


      if (
        montoFinal <
        totalAplicado
      ) {
        throw new Error(
          `No se puede reducir el anticipo a $${montoFinal.toLocaleString(
            "es-AR",
            {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }
          )} porque ya tiene $${totalAplicado.toLocaleString(
            "es-AR",
            {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }
          )} aplicados a facturas.`
        );
      }
    }


    // ==================================================
    // ACTUALIZAR PAGO PROGRAMADO
    // ==================================================

    await pago.update(
      {
        fecha_programada:
          fechaFinal,

        medio:
          medioFinal,

        formapago_id:
          formaPagoFinal,

        banco_id:
          bancoFinal,

        caja_id:
          cajaFinal,

        echeq_fecha_vencimiento:
          echeqFechaVencimientoFinal,

        monto:
          montoFinal,

        descripcion:
          descripcionFinal,

        observaciones:
          observacionesFinal,

        categoriaegreso_id:
          categoriaFinal,

        imputacioncontable_id:
          imputacionFinal,

        proyecto_id:
          proyectoFinal,
      },

      {
        transaction:
          t,
      }
    );


    // ==================================================
    // SI ES ANTICIPO:
    // SINCRONIZAR ABONO DE CUENTA CORRIENTE
    // ==================================================

    if (
      pago.tipo === "anticipo" &&
      movCtaCte
    ) {
      const medioDescripcion =
        medioFinal === "caja"
          ? "Caja"
          : medioFinal === "echeq"
            ? "eCheq"
            : "Transferencia/Banco";


      await movCtaCte.update(
        {
          fecha:
            fechaFinal,

          fecha_pago:
            fechaFinal,

          descripcion:
            `Anticipo programado por ${medioDescripcion} #${pago.id} - ${descripcionFinal}`,

          importe:
            montoFinal,

          formapago_id:
            formaPagoFinal,
        },

        {
          transaction:
            t,
        }
      );
    }


    await t.commit();


    return res.json({
      ok: true,

      mensaje:
        pago.tipo === "anticipo"
          ? "Anticipo programado actualizado correctamente."
          : "Pago programado actualizado correctamente.",

      pagoProgramado:
        pago,

      movimientoCtaCte:
        movCtaCte,
    });


  } catch (error) {

    await t.rollback();


    console.error(
      "actualizarPagoProgramado:",
      error
    );


    return res.status(400).json({
      error:
        error.message ||
        "No se pudo actualizar el pago programado",
    });
  }
};