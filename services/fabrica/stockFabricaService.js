import { Op } from "sequelize";

import ProduccionLote from "../../models/fabrica/produccionLoteModel.js";
import ProduccionLoteDetalle from "../../models/fabrica/produccionLoteDetalleModel.js";

import InventarioMovimientoInterno from "../../models/rinde/inventarioMovimientoInternoModel.js";
import InventarioMovimientoOtro from "../../models/rinde/inventarioMovimientoOtroModel.js";

import ArticuloTabla from "../../models/tablas/articuloModel.js";

import Inventario
  from "../../models/rinde/inventarioModel.js";

import InventarioArticulo
  from "../../models/rinde/inventarioArticuloModel.js";

export const obtenerStockArticuloFabrica = async (
  codigobarra,
  fecha
) => {

  let produccion = 0;
  let entradas = 0;
  let egresos = 0;

  const lotes =
    await ProduccionLote.findAll({

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
      ]

    });

  for (const lote of lotes) {

    for (const detalle of lote.detalles) {

      produccion +=
        Number(
          detalle.cantidad || 0
        );

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

        articulocodigo:
          codigobarra

      }

    });

  for (const mov of movimientosEntrada) {

    entradas +=
      Number(
        mov.cantidad || 0
      );

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

        articulocodigo:
          codigobarra

      }

    });

  for (const mov of movimientosEgreso) {

    egresos +=
      Number(
        mov.cantidad || 0
      );

  }

  return {

    produccion,

    entradas,

    egresos,

    stockInicial:
      produccion +
      entradas -
      egresos

  };

};

export const obtenerStockCompletoFabrica = async (
  inventarioId,
  fechaDesde,
  fechaHasta
) => {

  const stockMap = {};

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

  if (!inventarioInicial) {
    throw new Error(
      "Inventario inicial no encontrado"
    );
  }

  if (inventarioInicial) {

    for (
      const articulo of
      inventarioInicial.Inventario_articulos
    ) {

      stockMap[
        articulo.articulocodigo
      ] = {

        codigobarra:
          articulo.articulocodigo,

        descripcion:
          articulo.articulodescripcion,

        stockInicial:
          Number(
            articulo.cantidadpeso || 0
          ),

        produccion: 0,

        entradas: 0,

        egresos: 0,

        ultimoMovimiento:
          inventarioInicial.fecha

      };

    }

  }

  const lotes =
    await ProduccionLote.findAll({

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
              as: "articulo"
            }
          ]
        }
      ]

    });

  for (const lote of lotes) {

    for (const detalle of lote.detalles) {

      const codigo =
        detalle.articulo?.codigobarra;

      if (!codigo) continue;

      if (!stockMap[codigo]) {

        stockMap[codigo] = {

          codigobarra:
            codigo,

          descripcion:
            detalle.articulo.descripcion,

          stockInicial: 0,

          produccion: 0,

          entradas: 0,

          egresos: 0,

          ultimoMovimiento: null

        };

      }

      stockMap[codigo].produccion +=
        Number(
          detalle.cantidad || 0
        );

      if (
        !stockMap[codigo]
          .ultimoMovimiento ||
        new Date(
          lote.fecha_produccion
        ) >
        new Date(
          stockMap[codigo]
            .ultimoMovimiento
        )
      ) {

        stockMap[codigo]
          .ultimoMovimiento =
          lote.fecha_produccion;

      }

    }

  }

  const entradas =
    await InventarioMovimientoInterno.findAll({

      where: {

        fecha: {
          [Op.between]: [
            fechaDesde,
            fechaHasta
          ]
        },

        tipo: "entrada",

        sucursal_id: 29

      }

    });

  for (const mov of entradas) {

    const codigo =
      mov.articulocodigo;

    if (!stockMap[codigo]) {

      stockMap[codigo] = {

        codigobarra:
          codigo,

        descripcion:
          mov.articulodescripcion,

        stockInicial: 0,

        produccion: 0,

        entradas: 0,

        egresos: 0,
        
        ultimoMovimiento: null


      };

    }

    stockMap[codigo].entradas +=
      Number(
        mov.cantidad || 0
      );

    if (
      !stockMap[codigo]
        .ultimoMovimiento ||
      new Date(
        mov.fecha
      ) >
      new Date(
        stockMap[codigo]
          .ultimoMovimiento
      )
    ) {

      stockMap[codigo]
        .ultimoMovimiento =
        mov.fecha;

    }

  }

  const egresos =
    await InventarioMovimientoOtro.findAll({

      where: {

        fecha: {
          [Op.between]: [
            fechaDesde,
            fechaHasta
          ]
        },

        tipo: "FABRICA"

      }

    });

  for (const mov of egresos) {

    const codigo =
      mov.articulocodigo;

    if (!stockMap[codigo]) {
      stockMap[codigo] = {

        codigobarra:
          codigo,

        descripcion:
          mov.articulodescripcion,

        stockInicial: 0,

        produccion: 0,

        entradas: 0,

        egresos: 0,

        ultimoMovimiento: null


      };

    }

    stockMap[codigo].egresos +=
      Number(
        mov.cantidad || 0
      );

    if (
      !stockMap[codigo]
        .ultimoMovimiento ||
      new Date(
        mov.fecha
      ) >
      new Date(
        stockMap[codigo]
          .ultimoMovimiento
      )
    ) {

      stockMap[codigo]
        .ultimoMovimiento =
        mov.fecha;

    }

  }

  return Object.values(
    stockMap
  )
    .map((item) => ({

      ...item,

      stockInicial:
        Number(
          item.stockInicial || 0
        ),

      stock:
        Number(
          item.stockInicial || 0
        ) +
        Number(
          item.produccion || 0
        ) +
        Number(
          item.entradas || 0
        ) -
        Number(
          item.egresos || 0
        )

    }))
    .sort(
      (a, b) =>
        a.descripcion.localeCompare(
          b.descripcion
        )
    );

};