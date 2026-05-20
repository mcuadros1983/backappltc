import { Op } from "sequelize";

import ArticuloPrecioTabla from "../models/tablas/articuloPrecioModel.js";
import PromocionTabla from "../models/tablas/promocionModel.js";
import PromocionArticuloTabla from "../models/tablas/promocionArticuloModel.js";
import PromocionDiaTabla from "../models/tablas/promocionDiaModel.js";

/**
 * Devuelve día de semana en formato 1-7 (lunes-domingo)
 */
function getDiaSemanaNumero(fecha = new Date()) {
  const dia = fecha.getDay(); // 0 domingo - 6 sábado
  return dia === 0 ? 7 : dia;
}

/**
 * Función principal
 */
export async function calcularPrecioArticulo({
  articulo_id,
  sucursal_id = null,
  listaprecio_id = null,
  fecha = new Date(),
}) {
  // =========================
  // 1. PRECIO BASE
  // =========================
  const precioBase = await ArticuloPrecioTabla.findOne({
    where: {
      articulo_id,
      ...(sucursal_id && { sucursal_id }),
      ...(listaprecio_id && { listaprecio_id }),
    },
  });

  if (!precioBase) {
    return {
      ok: false,
      error: "No se encontró precio base",
    };
  }

  const precio_normal = precioBase.precio;

  // =========================
  // 2. BUSCAR PROMOCIONES ACTIVAS
  // =========================
  const hoy = fecha;
  const hoyDate = hoy.toISOString().split("T")[0];
  const diaSemana = getDiaSemanaNumero(hoy);

  const promociones = await PromocionTabla.findAll({
    where: {
      activa: true,
      fecha_desde: { [Op.lte]: hoyDate },
      fecha_hasta: { [Op.gte]: hoyDate },
    },
    include: [
      {
        model: PromocionArticuloTabla,
        required: false,
      },
      {
        model: PromocionDiaTabla,
        required: true,
        where: { dia_semana: diaSemana },
      },
    ],
    order: [["prioridad", "DESC"]],
  });

  // =========================
  // 3. FILTRAR PROMOCIÓN APLICABLE
  // =========================
  let promocionAplicada = null;
  let detallePromocion = null;

  for (const promo of promociones) {
    const detalle = promo.PromocionArticuloTablas?.find(
      (p) => Number(p.articulo_id) === Number(articulo_id)
    );

    if (detalle) {
      promocionAplicada = promo;
      detallePromocion = detalle;
      break;
    }
  }

  // =========================
  // 4. SI NO HAY PROMO
  // =========================
  if (!promocionAplicada) {
    return {
      ok: true,
      precio_normal,
      precio_final: precio_normal,
      tiene_promocion: false,
      promocion: null,
    };
  }

  // =========================
  // 5. CALCULAR PRECIO FINAL
  // =========================
  let precio_final = precio_normal;
  const valorPromocion = Number(detallePromocion.valor);

  if (promocionAplicada.tipo_promocion === "precio_fijo") {
    precio_final = valorPromocion;
  }

  if (promocionAplicada.tipo_promocion === "porcentaje") {
    precio_final =
      precio_normal - (precio_normal * valorPromocion) / 100;
  }

  return {
    ok: true,
    precio_normal,
    precio_final,
    tiene_promocion: true,
    promocion: {
      id: promocionAplicada.id,
      descripcion: promocionAplicada.descripcion,
      tipo: promocionAplicada.tipo_promocion,
      valor: valorPromocion,
    },
  };
}

export async function calcularPreciosMasivo({
  articulos_ids = [],
  sucursal_id = null,
  listaprecio_id = null,
  fecha = new Date(),
}) {
  const hoyDate = fecha.toISOString().split("T")[0];
  const diaSemana = getDiaSemanaNumero(fecha);

  // =========================
  // 1. PRECIOS BASE
  // =========================
  const precios = await ArticuloPrecioTabla.findAll({
    where: {
      articulo_id: articulos_ids,
      ...(sucursal_id && { sucursal_id }),
      ...(listaprecio_id && { listaprecio_id }),
    },
  });

  const preciosMap = {};
  precios.forEach((p) => {
    preciosMap[p.articulo_id] = p.precio;
  });

  // =========================
  // 2. PROMOCIONES ACTIVAS
  // =========================
  const promociones = await PromocionTabla.findAll({
    where: {
      activa: true,
      fecha_desde: { [Op.lte]: hoyDate },
      fecha_hasta: { [Op.gte]: hoyDate },
    },
    include: [
      {
        model: PromocionArticuloTabla,
        required: false,
      },
      {
        model: PromocionDiaTabla,
        required: true,
        where: {
          dia_semana: diaSemana,
        },
      },
    ],
  });

  // =========================
  // 3. PROCESAR ARTÍCULOS
  // =========================
  const resultados = [];

  for (const articulo_id of articulos_ids) {
    const precio_normal = preciosMap[articulo_id];

    if (!precio_normal) {
      resultados.push({
        articulo_id,
        ok: false,
        error: "Sin precio base",
      });
      continue;
    }

    let promocionAplicada = null;
    let detallePromocion = null;

    for (const promo of promociones) {
      const detalle = promo.PromocionArticuloTablas?.find(
        (p) => Number(p.articulo_id) === Number(articulo_id)
      );

      if (detalle) {
        promocionAplicada = promo;
        detallePromocion = detalle;
        break;
      }
    }

    let precio_final = precio_normal;

    if (promocionAplicada && detallePromocion) {
      const valorPromocion = Number(detallePromocion.valor);

      if (promocionAplicada.tipo_promocion === "precio_fijo") {
        precio_final = valorPromocion;
      }

      if (promocionAplicada.tipo_promocion === "porcentaje") {
        precio_final =
          precio_normal -
          (precio_normal * valorPromocion) / 100;
      }
    }

    resultados.push({
      articulo_id,
      ok: true,
      precio_normal,
      precio_final,
      tiene_promocion: !!promocionAplicada,
      promocion: promocionAplicada && detallePromocion
        ? {
          id: promocionAplicada.id,
          descripcion: promocionAplicada.descripcion,
          tipo: promocionAplicada.tipo_promocion,
          valor: Number(detallePromocion.valor),
        }
        : null,
    });
  }

  return {
    ok: true,
    total: resultados.length,
    resultados,
  };
}