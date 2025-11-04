// server/controllers/proyeccion/helpers/ventasRealHelper.js
import { Op } from "sequelize";
import VentaTotal from "../../../models/rinde/ventaTotalModel.js"; // ajustá el path real según tu estructura
import VentasArticulo from "../../../models/rinde/ventaArticuloModel.js"; // ajustá path real
// arriba: asumo que VentasArticulo es el modelo que usaste en obtenerVentasFiltradas
// si está en otra carpeta, actualizá el import

export async function obtenerVentasRealesMap({ fechaDesde, fechaHasta, sucursalId }) {
    // armamos filtros igual que en obtenerVentasFiltradas
    const filters = {
        fecha: {
            [Op.between]: [fechaDesde, fechaHasta],
        },
    };
    if (sucursalId) {
        filters.sucursal_id = sucursalId;
    }

    // 1) Traer ventas totales
    const ventasFiltradas = await VentaTotal.findAll({ where: filters });

    // Agrupar por fecha-sucursal sumando monto
    const ventasAgrupadas = {};
    ventasFiltradas.forEach((venta) => {
        const key = `${venta.fecha}::${venta.sucursal_id}`;
        if (!ventasAgrupadas[key]) {
            ventasAgrupadas[key] = 0;
        }
        ventasAgrupadas[key] += parseFloat(venta.monto);
    });

    // 2) Traer ventas de artículos especiales a restar
    const articuloFilters = {
        ...filters,
        articuloCodigo: {
            [Op.in]: ["1005", "1012", "1011"],
        },
    };

    const ventasConArticulos = await VentasArticulo.findAll({
        where: articuloFilters,
    });

    const montosARestarPorFechaYSucursal = {};
    ventasConArticulos.forEach((venta) => {
        const key = `${venta.fecha}::${venta.sucursal_id}`;
        if (!montosARestarPorFechaYSucursal[key]) {
            montosARestarPorFechaYSucursal[key] = 0;
        }
        montosARestarPorFechaYSucursal[key] +=
            Number(venta.cantidad) * Number(venta.monto_lista);
    });

    // 3) Aplicar resta
    Object.keys(montosARestarPorFechaYSucursal).forEach((key) => {
        if (ventasAgrupadas[key] != null) {
            ventasAgrupadas[key] -= montosARestarPorFechaYSucursal[key];
        }
    });

    // devolvemos un map { "2025-11-01::2": 123456.78, ... }
    return ventasAgrupadas;
}



export async function obtenerVentasFiltradasLikeController({
  fechaDesde,
  fechaHasta,
  sucursalId,
}) {
  const filters = {
    fecha: { [Op.between]: [fechaDesde, fechaHasta] },
  };
  if (sucursalId) {
    filters.sucursal_id = sucursalId;
  }

  // 1. Traer ventas totales
  const ventasFiltradas = await VentaTotal.findAll({ where: filters });

  // 2. Agrupar por fecha-sucursal sumando monto
  const ventasAgrupadas = {};
  for (const venta of ventasFiltradas) {
    const key = `${venta.fecha}-${venta.sucursal_id}`;
    if (!ventasAgrupadas[key]) {
      ventasAgrupadas[key] = {
        fecha: venta.fecha,
        sucursal_id: venta.sucursal_id,
        monto: 0,
      };
    }
    ventasAgrupadas[key].monto += Number(venta.monto);
  }

  // 3. Traer artículos a restar
  const articuloFilters = {
    ...filters,
    articuloCodigo: { [Op.in]: ["1005", "1012", "1011"] },
  };
  const ventasConArticulos = await VentasArticulo.findAll({
    where: articuloFilters,
  });

  // 4. Calcular cuánto restar
  const restasPorKey = {};
  for (const venta of ventasConArticulos) {
    const key = `${venta.fecha}-${venta.sucursal_id}`;
    const resta =
      Number(venta.cantidad) * Number(venta.monto_lista || 0);
    restasPorKey[key] = (restasPorKey[key] || 0) + resta;
  }

  // 5. Aplicar la resta
  for (const key of Object.keys(ventasAgrupadas)) {
    if (restasPorKey[key]) {
      ventasAgrupadas[key].monto -= restasPorKey[key];
    }
  }

  // 6. Volver a array [{fecha, sucursal_id, monto}, ...]
  return Object.values(ventasAgrupadas);
}