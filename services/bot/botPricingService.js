import { Op } from "sequelize";
import { calcularPreciosMasivo } from "../promocionService.js";

import PromocionTabla from "../../models/tablas/promocionModel.js";
import PromocionArticuloTabla from "../../models/tablas/promocionArticuloModel.js";
import PromocionDiaTabla from "../../models/tablas/promocionDiaModel.js";
import ArticuloTabla from "../../models/tablas/articuloModel.js";
import ArticuloPrecioTabla from "../../models/tablas/articuloPrecioModel.js";

function getDiaSemanaNumero(fecha = new Date()) {
  const dia = fecha.getDay();
  return dia === 0 ? 7 : dia;
}

export async function getProductPrices({
  articulos_ids = [],
  sucursal_id = null,
  listaprecio_id = null,
}) {
  if (!Array.isArray(articulos_ids) || articulos_ids.length === 0) {
    return [];
  }

  const response = await calcularPreciosMasivo({
    articulos_ids,
    sucursal_id,
    listaprecio_id,
  });

  if (Array.isArray(response)) return response;
  if (response?.resultados) return response.resultados;

  return [];
}

export async function getActivePromotionProductsForBot({
  sucursal_id = null,
  listaprecio_id = null,
  fecha = new Date(),
  limit = 100,
} = {}) {
  const hoyDate = fecha.toISOString().split("T")[0];
  const diaSemana = getDiaSemanaNumero(fecha);

  const promociones = await PromocionTabla.findAll({
    where: {
      activa: true,
      fecha_desde: { [Op.lte]: hoyDate },
      fecha_hasta: { [Op.gte]: hoyDate },
    },
    include: [
      {
        model: PromocionArticuloTabla,
        required: true,
        include: [
          {
            model: ArticuloTabla,
            required: false,
          },
        ],
      },
      {
        model: PromocionDiaTabla,
        required: true,
        where: {
          dia_semana: diaSemana,
        },
      },
    ],
    order: [
      ["prioridad", "DESC"],
      ["id", "ASC"],
    ],
  });

  const rows = [];

  for (const promo of promociones) {
    const detalles = promo.PromocionArticuloTablas || [];

    for (const detalle of detalles) {
      const articuloId = Number(detalle.articulo_id);

      const precioBase = await ArticuloPrecioTabla.findOne({
        where: {
          articulo_id: articuloId,
          ...(sucursal_id && { sucursal_id }),
          ...(listaprecio_id && { listaprecio_id }),
        },
      });

      const precioNormal = precioBase ? Number(precioBase.precio) : null;
      const valorPromo = Number(detalle.valor);

      let precioFinal = precioNormal;

      if (promo.tipo_promocion === "precio_fijo") {
        precioFinal = valorPromo;
      }

      if (promo.tipo_promocion === "porcentaje" && precioNormal !== null) {
        precioFinal = precioNormal - (precioNormal * valorPromo) / 100;
      }

      rows.push({
        promocion_id: promo.id,
        promocion_descripcion: promo.descripcion,
        tipo_promocion: promo.tipo_promocion,
        valor_promocion: valorPromo,
        articulo_id: articuloId,
        articulo_nombre:
          detalle.Articulotabla?.descripcionreducida ||
          detalle.Articulotabla?.descripcion ||
          `Artículo ${articuloId}`,
        precio_normal: precioNormal,
        precio_final: precioFinal,
        prioridad: Number(promo.prioridad || 0),
      });
    }
  }

  return rows.slice(0, limit);
}

export default {
  getProductPrices,
  getActivePromotionProductsForBot,
};