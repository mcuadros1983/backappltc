import { Op } from "sequelize";

import MovimientoCajaTesoreria
  from "../../models/tesoreria/movimientocajatesoreria.js";

import MovimientoBancoTesoreria
  from "../../models/tesoreria/movimientobancotesoreria.js";

import EcheqEmitido
  from "../../models/tesoreria/pagoecheq.js";


/*
 * ============================================================
 * PAGOS REALIZADOS
 * ============================================================
 *
 * Consolida:
 *
 * - MovimientoCajaTesoreria  -> egresos
 * - MovimientoBancoTesoreria -> egresos
 * - EcheqEmitido             -> vigentes / no acreditados
 *
 * No modifica ningún movimiento.
 * Solamente genera un listado unificado.
 * ============================================================
 */

export const listarPagosRealizados = async (req, res) => {

  try {

    const {
      empresa_id,
      proveedor_id,

      tipo_pago, // todos | caja | banco | echeq

      banco_id,
      caja_id,
      formapago_id,
      proyecto_id,
      categoriaegreso_id,

      fecha_desde,
      fecha_hasta,

      monto_desde,
      monto_hasta,

      numero_echeq,
      ordenpago_id,
      comprobanteegreso_id,

      q,

      page = "1",
      limit = "20",

      order = "fecha",
      dir = "DESC",

    } = req.query || {};


    /*
     * ============================================================
     * 1. PAGINACIÓN
     * ============================================================
     */

    const pageNumber =
      Math.max(
        1,
        Number(page) || 1
      );

    const limitNumber =
      Math.min(
        100,
        Math.max(
          1,
          Number(limit) || 20
        )
      );


    /*
     * ============================================================
     * 2. DETERMINAR QUÉ TIPOS CONSULTAR
     * ============================================================
     */

    const tipoNormalizado =
      String(tipo_pago || "todos")
        .trim()
        .toLowerCase();


    const buscarCaja =
      tipoNormalizado === "todos" ||
      tipoNormalizado === "caja";


    const buscarBanco =
      tipoNormalizado === "todos" ||
      tipoNormalizado === "banco";


    const buscarEcheq =
      tipoNormalizado === "todos" ||
      tipoNormalizado === "echeq";


    /*
     * ============================================================
     * 3. WHERE CAJA
     * ============================================================
     */

    const whereCaja = {

      tipo: "egreso",

      [Op.or]: [
        { anulado: false },
        { anulado: null },
      ],

    };


  if (proveedor_id) {
      whereCaja.proveedor_id =
        Number(proveedor_id);
    }


    if (caja_id) {
      whereCaja.caja_id =
        Number(caja_id);
    }


    if (formapago_id) {
      whereCaja.formapago_id =
        Number(formapago_id);
    }


    if (proyecto_id) {
      whereCaja.proyecto_id =
        Number(proyecto_id);
    }


    if (categoriaegreso_id) {
      whereCaja.categoriaegreso_id =
        Number(categoriaegreso_id);
    }


    if (ordenpago_id) {
      whereCaja.ordenpago_id =
        Number(ordenpago_id);
    }


    if (comprobanteegreso_id) {
      whereCaja.comprobanteegreso_id =
        Number(comprobanteegreso_id);
    }


    /*
     * Fecha Caja
     */

    if (fecha_desde || fecha_hasta) {

      whereCaja.fecha = {};

      if (fecha_desde) {
        whereCaja.fecha[Op.gte] =
          fecha_desde;
      }

      if (fecha_hasta) {
        whereCaja.fecha[Op.lte] =
          fecha_hasta;
      }

    }


    /*
     * Monto Caja
     */

    if (monto_desde || monto_hasta) {

      whereCaja.monto = {};

      if (monto_desde) {
        whereCaja.monto[Op.gte] =
          Number(monto_desde);
      }

      if (monto_hasta) {
        whereCaja.monto[Op.lte] =
          Number(monto_hasta);
      }

    }


    /*
     * Búsqueda de texto Caja
     */

    if (q) {

      whereCaja.descripcion = {
        [Op.iLike]:
          `%${String(q).trim()}%`,
      };

    }


    /*
     * ============================================================
     * 4. WHERE BANCO
     * ============================================================
     */

    const whereBanco = {

      tipo: "egreso",

      [Op.or]: [
        { anulado: false },
        { anulado: null },
      ],

    };


    if (proveedor_id) {
      whereBanco.proveedor_id =
        Number(proveedor_id);
    }


    if (banco_id) {
      whereBanco.banco_id =
        Number(banco_id);
    }


    if (formapago_id) {
      whereBanco.formapago_id =
        Number(formapago_id);
    }


    if (proyecto_id) {
      whereBanco.proyecto_id =
        Number(proyecto_id);
    }


    if (categoriaegreso_id) {
      whereBanco.categoriaegreso_id =
        Number(categoriaegreso_id);
    }


    if (ordenpago_id) {
      whereBanco.ordenpago_id =
        Number(ordenpago_id);
    }


    if (comprobanteegreso_id) {
      whereBanco.comprobanteegreso_id =
        Number(comprobanteegreso_id);
    }


    /*
     * Fecha Banco
     */

    if (fecha_desde || fecha_hasta) {

      whereBanco.fecha = {};

      if (fecha_desde) {
        whereBanco.fecha[Op.gte] =
          fecha_desde;
      }

      if (fecha_hasta) {
        whereBanco.fecha[Op.lte] =
          fecha_hasta;
      }

    }


    /*
     * Monto Banco
     */

    if (monto_desde || monto_hasta) {

      whereBanco.monto = {};

      if (monto_desde) {
        whereBanco.monto[Op.gte] =
          Number(monto_desde);
      }

      if (monto_hasta) {
        whereBanco.monto[Op.lte] =
          Number(monto_hasta);
      }

    }


    /*
     * Búsqueda Banco
     */

    if (q) {

      whereBanco.descripcion = {
        [Op.iLike]:
          `%${String(q).trim()}%`,
      };

    }


    /*
     * ============================================================
     * 5. WHERE ECHEQ
     * ============================================================
     */

    const whereEcheq = {

      [Op.and]: [

        {
          [Op.or]: [
            { anulado: false },
            { anulado: null },
          ],
        },

        {
          estado: {
            [Op.in]: [
              "emitido",
              "entregado",
              "presentado",
            ],
          },
        },

      ],

    };


    if (proveedor_id) {
      whereEcheq.proveedor_id =
        Number(proveedor_id);
    }


    if (banco_id) {
      whereEcheq.banco_id =
        Number(banco_id);
    }


    if (ordenpago_id) {
      whereEcheq.ordenpago_id =
        Number(ordenpago_id);
    }


    if (comprobanteegreso_id) {
      whereEcheq.comprobanteegreso_id =
        Number(comprobanteegreso_id);
    }


    /*
     * Fecha eCheq
     *
     * Para Pagos Realizados utilizamos fecha_emision.
     */

    if (fecha_desde || fecha_hasta) {

      whereEcheq.fecha_emision = {};

      if (fecha_desde) {
        whereEcheq.fecha_emision[Op.gte] =
          fecha_desde;
      }

      if (fecha_hasta) {
        whereEcheq.fecha_emision[Op.lte] =
          fecha_hasta;
      }

    }


    /*
     * Monto eCheq
     */

    if (monto_desde || monto_hasta) {

      whereEcheq.importe = {};

      if (monto_desde) {
        whereEcheq.importe[Op.gte] =
          Number(monto_desde);
      }

      if (monto_hasta) {
        whereEcheq.importe[Op.lte] =
          Number(monto_hasta);
      }

    }


    /*
     * Nº eCheq
     */

    if (numero_echeq) {

      whereEcheq.numero_echeq = {
        [Op.iLike]:
          `%${String(numero_echeq).trim()}%`,
      };

    }


    /*
     * ============================================================
     * 6. EJECUTAR CONSULTAS
     * ============================================================
     */

    const [
      movimientosCaja,
      movimientosBanco,
      echeqs,
    ] = await Promise.all([

      buscarCaja
        ? MovimientoCajaTesoreria.findAll({
            where: whereCaja,
          })
        : Promise.resolve([]),

      buscarBanco
        ? MovimientoBancoTesoreria.findAll({
            where: whereBanco,
          })
        : Promise.resolve([]),

      buscarEcheq
        ? EcheqEmitido.findAll({
            where: whereEcheq,
          })
        : Promise.resolve([]),

    ]);


    /*
     * ============================================================
     * 7. NORMALIZAR CAJA
     * ============================================================
     */

    const cajaNormalizada =
      movimientosCaja.map((r) => {

        const x =
          r.get
            ? r.get({ plain: true })
            : r;

        return {

          tipo_pago: "caja",

          id: x.id,

          fecha:
            x.fecha,

          descripcion:
            x.descripcion || "",

          monto:
            Number(x.monto || 0),

          empresa_id:
            x.empresa_id || null,

          proveedor_id:
            x.proveedor_id || null,

          caja_id:
            x.caja_id || null,

          banco_id:
            null,

          formapago_id:
            x.formapago_id || null,

          proyecto_id:
            x.proyecto_id || null,

          categoriaegreso_id:
            x.categoriaegreso_id || null,

          ordenpago_id:
            x.ordenpago_id || null,

          comprobanteegreso_id:
            x.comprobanteegreso_id || null,

          referencia_tipo:
            x.referencia_tipo || null,

          referencia_id:
            x.referencia_id || null,

          numero_echeq:
            null,

          fecha_vencimiento:
            null,

          estado:
            "vigente",

          anulado:
            Boolean(x.anulado),

        };

      });


    /*
     * ============================================================
     * 8. NORMALIZAR BANCO
     * ============================================================
     */

    const bancoNormalizado =
      movimientosBanco.map((r) => {

        const x =
          r.get
            ? r.get({ plain: true })
            : r;

        return {

          tipo_pago: "banco",

          id: x.id,

          fecha:
            x.fecha,

          descripcion:
            x.descripcion || "",

          monto:
            Number(x.monto || 0),

          empresa_id:
            x.empresa_id || null,

          proveedor_id:
            x.proveedor_id || null,

          caja_id:
            null,

          banco_id:
            x.banco_id || null,

          formapago_id:
            x.formapago_id || null,

          proyecto_id:
            x.proyecto_id || null,

          categoriaegreso_id:
            x.categoriaegreso_id || null,

          ordenpago_id:
            x.ordenpago_id || null,

          comprobanteegreso_id:
            x.comprobanteegreso_id || null,

          referencia_tipo:
            x.referencia_tipo || null,

          referencia_id:
            x.referencia_id || null,

          numero_echeq:
            null,

          fecha_vencimiento:
            null,

          estado:
            "vigente",

          anulado:
            Boolean(x.anulado),

        };

      });


    /*
     * ============================================================
     * 9. NORMALIZAR ECHEQ
     * ============================================================
     */

    const echeqNormalizado =
      echeqs.map((r) => {

        const x =
          r.get
            ? r.get({ plain: true })
            : r;

        return {

          tipo_pago: "echeq",

          id:
            x.id,

          fecha:
            x.fecha_emision,

          descripcion:
            x.observaciones ||
            `eCheq ${x.numero_echeq || ""}`,

          monto:
            Number(x.importe || 0),

          empresa_id:
            x.empresa_id || null,

          proveedor_id:
            x.proveedor_id || null,

          caja_id:
            null,

          banco_id:
            x.banco_id || null,

          /*
           * EcheqEmitido no posee necesariamente
           * formapago_id.
           */
          formapago_id:
            null,

          proyecto_id:
            x.proyecto_id || null,

          categoriaegreso_id:
            x.categoriaegreso_id || null,

          ordenpago_id:
            x.ordenpago_id || null,

          comprobanteegreso_id:
            x.comprobanteegreso_id || null,

          referencia_tipo:
            x.referencia_tipo || null,

          referencia_id:
            x.referencia_id || null,

          numero_echeq:
            x.numero_echeq || null,

          fecha_vencimiento:
            x.fecha_vencimiento || null,

          estado:
            x.estado || "emitido",

          anulado:
            Boolean(x.anulado),

        };

      });


    /*
     * ============================================================
     * 10. UNIFICAR
     * ============================================================
     */

    let rows = [
      ...cajaNormalizada,
      ...bancoNormalizado,
      ...echeqNormalizado,
    ];


    /*
     * ============================================================
     * 11. FILTROS QUE NO APLICAN A TODOS LOS MODELOS
     * ============================================================
     */


    /*
     * Si se eligió banco:
     *
     * - Banco debe coincidir.
     * - eCheq debe coincidir.
     * - Caja queda excluida.
     */

    if (banco_id) {

      rows =
        rows.filter(
          (r) =>
            Number(r.banco_id || 0) ===
            Number(banco_id)
        );

    }


    /*
     * Si se eligió caja:
     *
     * solamente pueden quedar movimientos de caja.
     */

    if (caja_id) {

      rows =
        rows.filter(
          (r) =>
            Number(r.caja_id || 0) ===
            Number(caja_id)
        );

    }


    /*
     * Nº eCheq:
     *
     * Si se utiliza este filtro solamente tiene sentido
     * mostrar eCheqs.
     */

    if (numero_echeq) {

      const texto =
        String(numero_echeq)
          .trim()
          .toLowerCase();

      rows =
        rows.filter(
          (r) =>
            r.tipo_pago === "echeq" &&
            String(r.numero_echeq || "")
              .toLowerCase()
              .includes(texto)
        );

    }


    /*
     * Búsqueda general.
     *
     * Para Caja/Banco ya fue enviada a PostgreSQL.
     * Para eCheq permitimos buscar también por número.
     */

    if (q) {

      const texto =
        String(q)
          .trim()
          .toLowerCase();

      rows =
        rows.filter((r) => {

          const descripcion =
            String(
              r.descripcion || ""
            ).toLowerCase();

          const numero =
            String(
              r.numero_echeq || ""
            ).toLowerCase();

          return (
            descripcion.includes(texto) ||
            numero.includes(texto)
          );

        });

    }


    /*
     * ============================================================
     * 12. ORDENAMIENTO
     * ============================================================
     */

    const camposOrdenables =
      new Set([
        "fecha",
        "tipo_pago",
        "descripcion",
        "monto",
        "proveedor_id",
        "banco_id",
        "caja_id",
        "ordenpago_id",
        "comprobanteegreso_id",
        "estado",
        "numero_echeq",
        "fecha_vencimiento",
      ]);


    const orderField =
      camposOrdenables.has(order)
        ? order
        : "fecha";


    const direction =
      String(dir || "DESC")
        .toUpperCase() === "ASC"
        ? 1
        : -1;


    rows.sort((a, b) => {

      let av =
        a[orderField];

      let bv =
        b[orderField];


      /*
       * Nulls siempre al final.
       */

      if (
        av === null ||
        av === undefined ||
        av === ""
      ) {

        if (
          bv === null ||
          bv === undefined ||
          bv === ""
        ) {
          return 0;
        }

        return 1;
      }


      if (
        bv === null ||
        bv === undefined ||
        bv === ""
      ) {
        return -1;
      }


      /*
       * Campos numéricos.
       */

      if (
        [
          "monto",
          "proveedor_id",
          "banco_id",
          "caja_id",
          "ordenpago_id",
          "comprobanteegreso_id",
        ].includes(orderField)
      ) {

        const diff =
          Number(av) -
          Number(bv);

        if (diff !== 0) {
          return diff * direction;
        }

      } else {

        const compare =
          String(av).localeCompare(
            String(bv),
            "es",
            {
              numeric: true,
              sensitivity: "base",
            }
          );

        if (compare !== 0) {
          return compare * direction;
        }

      }


      /*
       * Desempate por ID.
       *
       * Más reciente primero.
       */

      return (
        Number(b.id || 0) -
        Number(a.id || 0)
      );

    });


    /*
     * ============================================================
     * 13. PAGINACIÓN
     * ============================================================
     */

    const total =
      rows.length;


    const totalPages =
      Math.max(
        1,
        Math.ceil(
          total /
          limitNumber
        )
      );


    const currentPage =
      Math.min(
        pageNumber,
        totalPages
      );


    const offset =
      (currentPage - 1) *
      limitNumber;


    const paginatedRows =
      rows.slice(
        offset,
        offset + limitNumber
      );


    /*
     * ============================================================
     * 14. RESPUESTA
     * ============================================================
     */

    return res.json({

      rows:
        paginatedRows,

      total,

      page:
        currentPage,

      limit:
        limitNumber,

      totalPages,

      order:
        orderField,

      dir:
        direction === 1
          ? "ASC"
          : "DESC",

    });


  } catch (error) {

    console.error(
      "❌ listarPagosRealizados:",
      error
    );

    return res.status(500).json({

      error:
        "Error al listar los pagos realizados",

      detalle:
        error.message,

    });

  }

};