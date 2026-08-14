import { Op } from "sequelize";

import ProduccionLote from "../../models/fabrica/produccionLoteModel.js";
import ProduccionLoteDetalle from "../../models/fabrica/produccionLoteDetalleModel.js";

import InventarioMovimientoInterno from "../../models/rinde/inventarioMovimientoInternoModel.js";
import InventarioMovimientoOtro from "../../models/rinde/inventarioMovimientoOtroModel.js";

import ArticuloTabla from "../../models/tablas/articuloModel.js";

import {
  obtenerStockCompletoFabrica
} from "../../services/fabrica/stockFabricaService.js";

import Sucursal
  from "../../models/gmedias/sucursalModel.js";

import {
  obtenerStockArticuloFabrica
} from "../../services/fabrica/stockFabricaService.js";

import Inventario
  from "../../models/rinde/inventarioModel.js";

import InventarioArticulo
  from "../../models/rinde/inventarioArticuloModel.js";

import { sequelize } from "../../config/database.js";


export const obtenerStockFabrica = async (
  req,
  res
) => {

  try {

    // const fecha =
    //   req.query.fecha;

    const {
      inventarioId,
      fechaDesde,
      fechaHasta
    } = req.query;

    if (!inventarioId) {

      return res.status(400).json({
        message:
          "Debe seleccionar un inventario"
      });

    }

    if (!fechaDesde) {

      return res.status(400).json({
        message:
          "Debe indicar una fecha de inicio"
      });

    }

    if (!fechaHasta) {

      return res.status(400).json({
        message:
          "Debe indicar una fecha de corte"
      });

    }

    // const stock =
    //   await obtenerStockCompletoFabrica(
    //     fecha
    //   );

    const stock =
      await obtenerStockCompletoFabrica(
        inventarioId,
        fechaDesde,
        fechaHasta
      );

    console.log("data", inventarioId,
      fechaDesde,
      fechaHasta,stock)

    return res.json(
      stock
    );

  } catch (error) {

    console.error(error);

    return res.status(500).json(
      error
    );

  }

};

export const obtenerDetalleStockFabrica = async (req, res) => {

  try {

    const { codigobarra } = req.params;

    // const fecha = req.query.fecha;
    const {
      inventarioId,
      fechaDesde,
      fechaHasta
    } = req.query;



    if (
      !inventarioId ||
      !fechaDesde ||
      !fechaHasta
    ) {

      return res.status(400).json({
        message: "Debe indicar un inventario, una fecha desde y una fecha hasta"
      });

    }

    let produccion = 0;
    let entradas = 0;
    let egresos = 0;
    let stockInicial = 0;

    const movimientos = [];

    const inventarioInicial =
      await Inventario.findByPk(
        inventarioId,
        {

          include: [
            {
              model: InventarioArticulo,
              through: {
                attributes: []
              }
            }
          ]

        }
      );

    if (inventarioInicial) {

      const articuloInventario =
        inventarioInicial
          .Inventario_articulos
          ?.find(
            x =>
              x.articulocodigo ===
              codigobarra
          );

      stockInicial =
        Number(
          articuloInventario
            ?.cantidadpeso || 0
        );

    }

    if (stockInicial > 0) {

      movimientos.push({

        fecha:
          inventarioInicial.fecha,

        tipo:
          "INVENTARIO INICIAL",

        referencia:
          inventarioInicial.id,

        cantidad:
          stockInicial

      });

    }

    const lotes = await ProduccionLote.findAll({

      where: {
        fecha_produccion: {
          [Op.between]: [
            fechaDesde,
            fechaHasta
          ]
        }
      },

      include: [
        {
          model: ProduccionLoteDetalle,
          as: "detalles",

          include: [
            {
              model: ArticuloTabla,
              as: "articulo",

              where: {
                codigobarra
              }
            }
          ]
        }
      ],

      order: [
        ["fecha_produccion", "ASC"]
      ]

    });

    for (const lote of lotes) {

      for (const detalle of lote.detalles) {

        const cantidad =
          Number(detalle.cantidad || 0);

        produccion += cantidad;

        movimientos.push({

          fecha: lote.fecha_produccion,

          tipo: "PRODUCCION",

          referencia: lote.numero_lote,

          lote:
            lote.numero_lote,

          cantidad

        });

      }

    }

    const movimientosEntrada =
      await InventarioMovimientoInterno.findAll({

        where: {

          fecha: {
            [Op.between]: [
              fechaDesde,
              fechaHasta
            ]
          },

          tipo: "entrada",

          sucursal_id: 29,

          articulocodigo: codigobarra

        },

        order: [
          ["fecha", "ASC"]
        ]

      });
    for (const mov of movimientosEntrada) {

      const cantidad =
        Number(mov.cantidad || 0);

      entradas += cantidad;

      let sucursalDestino = null;

      if (mov.sucursal_id) {

        const sucursal =
          await Sucursal.findByPk(
            mov.sucursal_id
          );

        sucursalDestino =
          sucursal?.descripcion ||
          sucursal?.nombre ||
          null;

      }

      movimientos.push({

        fecha: mov.fecha,

        tipo: "ENTRADA",

        referencia: mov.numerolote,

        movimiento_id: mov.id,

        sucursal_origen:
          "FABRICA",

        sucursal_destino:
          sucursalDestino,

        cantidad

      });

    }

    const movimientosEgreso =
      await InventarioMovimientoOtro.findAll({

        where: {

          fecha: {
            [Op.between]: [
              fechaDesde,
              fechaHasta
            ]
          },

          tipo: "FABRICA",

          articulocodigo: codigobarra

        },

        order: [
          ["fecha", "ASC"]
        ]

      });
    for (const mov of movimientosEgreso) {

      const cantidad =
        Number(mov.cantidad || 0);

      egresos += cantidad;

      let sucursalDestino = null;

      if (mov.sucursaldestino_id) {

        const sucursal =
          await Sucursal.findByPk(
            mov.sucursaldestino_id
          );

        sucursalDestino =
          sucursal?.descripcion ||
          sucursal?.nombre ||
          null;

      }

      movimientos.push({

        fecha: mov.fecha,

        tipo: "EGRESO",

        referencia: mov.numerolote,

        movimiento_id: mov.id,

        sucursal_destino:
          sucursalDestino,

        cantidad: -cantidad

      });

    }

    movimientos.sort(
      (a, b) =>
        new Date(a.fecha) -
        new Date(b.fecha)
    );

    const articulo =
      await ArticuloTabla.findOne({

        where: {
          codigobarra
        }

      });

    return res.json({

      codigobarra,

      descripcion:
        articulo?.descripcion || "",

      stockInicial,

      produccion,

      entradas,

      egresos,

      stock:
        stockInicial +
        produccion +
        entradas -
        egresos,

      movimientos

    });

  } catch (error) {

    console.error(error);

    return res.status(500).json(error);

  }

};



export const transferirDesdeFabrica = async (req, res) => {

  const transaction =
    await sequelize.transaction();

  try {

    const {
      fecha,
      sucursaldestino_id,
      usuario_id,
      articulos
    } = req.body;

    if (!fecha) {

      await transaction.rollback();

      return res.status(400).json({
        message: "Debe indicar una fecha"
      });

    }

    if (!sucursaldestino_id) {

      await transaction.rollback();

      return res.status(400).json({
        message: "Debe indicar una sucursal destino"
      });

    }

    if (!articulos?.length) {

      await transaction.rollback();

      return res.status(400).json({
        message: "Debe indicar al menos un artículo"
      });

    }

    for (const item of articulos) {

      const articulo =
        await ArticuloTabla.findByPk(
          item.articulo_id
        );

      if (!articulo) {

        throw new Error(
          `Artículo ${item.articulo_id} no encontrado`
        );

      }

      /*
      VALIDACION DE STOCK DE FABRICA
      ------------------------------------
      Verificamos que exista stock suficiente
      antes de generar los movimientos.
      */

      // const stockInfo =
      //   await obtenerStockArticuloFabrica(
      //     articulo.codigobarra,
      //     fecha
      //   );

      // if (
      //   Number(stockInfo.stock) <
      //   Number(item.cantidad)
      // ) {

      //   throw new Error(
      //     `Stock insuficiente para ${articulo.descripcion}. ` +
      //     `Disponible: ${stockInfo.stock} - ` +
      //     `Solicitado: ${item.cantidad}`
      //   );

      // }

      await InventarioMovimientoOtro.create({

        articulocodigo:
          articulo.codigobarra,

        articulodescripcion:
          articulo.descripcion,

        numerolote: null,

        cantidad:
          Number(item.cantidad),

        fecha,

        sucursal_id: 29,

        sucursaldestino_id,

        tipo: "FABRICA"

      }, {
        transaction
      });

      // await InventarioMovimientoInterno.create({

      //   id:
      //     Date.now() +
      //     Math.floor(
      //       Math.random() * 1000
      //     ),

      //   articulocodigo:
      //     articulo.codigobarra,

      //   articulodescripcion:
      //     articulo.descripcion,

      //   numerolote: null,

      //   cantidad:
      //     Number(item.cantidad),

      //   fecha,

      //   sucursal_id:
      //     sucursaldestino_id,

      //   sucursaldestino_id:
      //     null,

      //   tipo: "entrada"

      // }, {
      //   transaction
      // });

    }

    await transaction.commit();

    return res.json({

      ok: true,

      message:
        "Transferencia realizada correctamente"

    });

  } catch (error) {

    await transaction.rollback();

    console.error(error);

    return res.status(500).json({
      message:
        error.message ||
        "Error al realizar la transferencia"
    });

  }

};


export const listarTransferenciasFabrica = async (
  req,
  res
) => {

  try {

    const {
      fechaDesde,
      fechaHasta,
      sucursalDestino
    } = req.query;

    const where = {
      tipo: "FABRICA"
    };

    if (
      fechaDesde &&
      fechaHasta
    ) {

      where.fecha = {
        [Op.between]: [
          fechaDesde,
          fechaHasta
        ]
      };

    }

    if (sucursalDestino) {

      where.sucursaldestino_id =
        sucursalDestino;

    }

    const movimientos =
      await InventarioMovimientoOtro.findAll({

        where,

        order: [
          ["fecha", "DESC"],
          ["createdAt", "DESC"]
        ]

      });

    const sucursalIds = [
      ...new Set(
        movimientos
          .map(
            x =>
              x.sucursaldestino_id
          )
          .filter(Boolean)
      )
    ];

    const sucursales =
      await Sucursal.findAll({

        where: {
          id: sucursalIds
        }

      });

    const sucursalMap = {};

    sucursales.forEach(
      suc => {

        sucursalMap[
          suc.id
        ] = suc.nombre;

      }
    );

    const grupos = {};

    for (const mov of movimientos) {

      const key =
        `${mov.fecha}_${mov.sucursaldestino_id}`;

      if (!grupos[key]) {

        grupos[key] = {

          fecha:
            mov.fecha,

          sucursaldestino_id:
            mov.sucursaldestino_id,

          sucursal:
            sucursalMap[
            mov.sucursaldestino_id
            ] || "",

          cantidadArticulos: 0,

          totalKg: 0

        };

      }

      grupos[key]
        .cantidadArticulos++;

      grupos[key]
        .totalKg += Number(
          mov.cantidad || 0
        );

    }

    return res.json(
      Object.values(
        grupos
      )
    );

  } catch (error) {

    console.error(error);

    return res
      .status(500)
      .json(error);

  }

};

export const listarDetalleTransferenciaFabrica = async (
  req,
  res
) => {

  try {

    const {
      fecha,
      sucursal
    } = req.query;

    if (!fecha) {

      return res.status(400).json({
        message:
          "Debe indicar una fecha"
      });

    }

    if (!sucursal) {

      return res.status(400).json({
        message:
          "Debe indicar una sucursal"
      });

    }

    const movimientos =
      await InventarioMovimientoOtro.findAll({

        where: {

          tipo: "FABRICA",

          fecha,

          sucursaldestino_id:
            sucursal

        },

        order: [
          ["articulodescripcion", "ASC"]
        ]

      });

    const resultado =
      movimientos.map(
        mov => ({

          id: mov.id,

          codigo:
            mov.articulocodigo,

          descripcion:
            mov.articulodescripcion,

          cantidad:
            Number(
              mov.cantidad || 0
            ),

          fecha:
            mov.fecha,

          sucursal:
            mov.sucursaldestino_id

        })
      );

    return res.json(
      resultado
    );

  } catch (error) {

    console.error(error);

    return res
      .status(500)
      .json(error);

  }

};

export const obtenerInventariosFabrica = async (
  req,
  res
) => {

  try {

    const inventarios =
      await Inventario.findAll({

        where: {
          sucursal_id: 29
        },

        order: [
          ["fecha", "DESC"]
        ]

      });

    return res.json(
      inventarios
    );

  } catch (error) {

    console.error(error);

    return res.status(500).json(
      error
    );

  }

};