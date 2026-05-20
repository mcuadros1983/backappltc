import { calcularPrecioArticulo } from "../../services/promocionService.js";
import { calcularPreciosMasivo } from "../../services/promocionService.js";
import PromocionTabla from "../../models/tablas/promocionModel.js";
import PromocionArticuloTabla from "../../models/tablas/promocionArticuloModel.js";
import PromocionDiaTabla from "../../models/tablas/promocionDiaModel.js";

/**
 * CREAR PROMOCIÓN
 */
export const crearPromocion = async (req, res) => {
  try {
    const {
      descripcion,
      tipo_promocion,
      fecha_desde,
      fecha_hasta,
      aplica_todos,
      activa,
      prioridad,
      articulos = [],
      dias = [],
    } = req.body;

    const promocion = await PromocionTabla.create({
      descripcion,
      tipo_promocion,
      fecha_desde,
      fecha_hasta,
      aplica_todos,
      activa,
      prioridad,
    });

    // Guardar artículos
    if (!aplica_todos && articulos.length > 0) {
      const detalles = articulos.map((item) => ({
        promocion_id: promocion.id,
        articulo_id: item.articulo_id,
        valor: item.valor,
      }));

      await PromocionArticuloTabla.bulkCreate(detalles);
    }

    // Guardar días
    if (dias.length > 0) {
      const diasData = dias.map((dia) => ({
        promocion_id: promocion.id,
        dia_semana: dia,
      }));

      await PromocionDiaTabla.bulkCreate(diasData);
    }

    return res.json({
      ok: true,
      message: "Promoción creada",
      promocion_id: promocion.id,
    });
  } catch (error) {
    console.error("Error crearPromocion:", error);
    return res.status(500).json({
      ok: false,
      error: "Error al crear promoción",
    });
  }
};

/**
 * LISTAR PROMOCIONES
 */
export const listarPromociones = async (req, res) => {
  try {
    const promociones = await PromocionTabla.findAll({
      include: [
        {
          model: PromocionArticuloTabla,
          required: false,
        },
        {
          model: PromocionDiaTabla,
          required: false,
        },
      ],
      order: [["id", "DESC"]],
    });

    return res.json({
      ok: true,
      total: promociones.length,
      promociones,
    });
  } catch (error) {
    console.error("Error listarPromociones:", error);
    return res.status(500).json({
      ok: false,
      error: "Error al listar promociones",
    });
  }
};

/**
 * OBTENER UNA PROMOCIÓN
 */
export const obtenerPromocion = async (req, res) => {
  try {
    const { id } = req.params;

    const promocion = await PromocionTabla.findByPk(id, {
      include: [
        {
          model: PromocionArticuloTabla,
          required: false,
        },
        {
          model: PromocionDiaTabla,
          required: false,
        },
      ],
    });

    if (!promocion) {
      return res.status(404).json({
        ok: false,
        error: "Promoción no encontrada",
      });
    }

    return res.json({
      ok: true,
      promocion,
    });
  } catch (error) {
    console.error("Error obtenerPromocion:", error);
    return res.status(500).json({
      ok: false,
      error: "Error al obtener promoción",
    });
  }
};

/**
 * ACTUALIZAR PROMOCIÓN
 */
export const actualizarPromocion = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      descripcion,
      tipo_promocion,
      fecha_desde,
      fecha_hasta,
      aplica_todos,
      activa,
      prioridad,
      articulos = [],
      dias = [],
    } = req.body;

    const promocion = await PromocionTabla.findByPk(id);

    if (!promocion) {
      return res.status(404).json({
        ok: false,
        error: "Promoción no encontrada",
      });
    }

    await promocion.update({
      descripcion,
      tipo_promocion,
      fecha_desde,
      fecha_hasta,
      aplica_todos,
      activa,
      prioridad,
    });

    // Eliminar detalles anteriores
    await PromocionArticuloTabla.destroy({
      where: { promocion_id: id },
    });

    await PromocionDiaTabla.destroy({
      where: { promocion_id: id },
    });

    // Re-crear artículos
    if (!aplica_todos && articulos.length > 0) {
      const detalles = articulos.map((item) => ({
        promocion_id: id,
        articulo_id: item.articulo_id,
        valor: item.valor,
      }));

      await PromocionArticuloTabla.bulkCreate(detalles);
    }

    // Re-crear días
    if (dias.length > 0) {
      const diasData = dias.map((dia) => ({
        promocion_id: id,
        dia_semana: dia,
      }));

      await PromocionDiaTabla.bulkCreate(diasData);
    }

    return res.json({
      ok: true,
      message: "Promoción actualizada",
    });
  } catch (error) {
    console.error("Error actualizarPromocion:", error);
    return res.status(500).json({
      ok: false,
      error: "Error al actualizar promoción",
    });
  }
};

/**
 * ELIMINAR PROMOCIÓN
 */
export const eliminarPromocion = async (req, res) => {
  try {
    const { id } = req.params;

    await PromocionArticuloTabla.destroy({
      where: { promocion_id: id },
    });

    await PromocionDiaTabla.destroy({
      where: { promocion_id: id },
    });

    await PromocionTabla.destroy({
      where: { id },
    });

    return res.json({
      ok: true,
      message: "Promoción eliminada",
    });
  } catch (error) {
    console.error("Error eliminarPromocion:", error);
    return res.status(500).json({
      ok: false,
      error: "Error al eliminar promoción",
    });
  }
};

export const getPreciosMasivo = async (req, res) => {
  try {
    const { articulos_ids, sucursal_id, listaprecio_id } = req.body;

    if (!articulos_ids || !Array.isArray(articulos_ids)) {
      return res.status(400).json({
        ok: false,
        error: "Debe enviar articulos_ids como array",
      });
    }

    const result = await calcularPreciosMasivo({
      articulos_ids,
      sucursal_id,
      listaprecio_id,
    });

    return res.json(result);
  } catch (error) {
    console.error("Error en getPreciosMasivo:", error);

    return res.status(500).json({
      ok: false,
      error: "Error al calcular precios masivos",
      details: error.message,
    });
  }
};
export const getPrecioArticulo = async (req, res) => {
  try {
    const { articulo_id } = req.params;
    const { sucursal_id, listaprecio_id } = req.query;

    const result = await calcularPrecioArticulo({
      articulo_id: Number(articulo_id),
      sucursal_id: sucursal_id ? Number(sucursal_id) : null,
      listaprecio_id: listaprecio_id ? Number(listaprecio_id) : null,
    });

    if (!result.ok) {
      return res.status(404).json(result);
    }

    return res.json(result);
  } catch (error) {
    console.error("Error en getPrecioArticulo:", error);

    return res.status(500).json({
      ok: false,
      error: "Error al calcular precio del artículo",
      details: error.message,
    });
  }
};