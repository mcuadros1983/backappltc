import {
  CampaniaFidelizacion,
  PremioCliente,
} from "../../models/fidelizacion/index.js";

const TIPOS_PREMIO_VALIDOS = [
  "producto",
  "descuento_porcentaje",
  "descuento_monto",
  "combo",
  "beneficio",
  "siga_participando",
];

export const listarPremiosCliente = async (req, res) => {
  try {
    const { campania_id, estado, tipo_premio } = req.query;

    const where = {};

    if (campania_id) where.campania_id = campania_id;
    if (estado) where.estado = estado;
    if (tipo_premio) where.tipo_premio = tipo_premio;

    const premios = await PremioCliente.findAll({
      where,
      include: [
        {
          model: CampaniaFidelizacion,
          as: "campania",
          required: false,
        },
      ],
      order: [
        ["prioridad", "ASC"],
        ["createdAt", "DESC"],
      ],
    });

    return res.json({
      ok: true,
      data: premios,
    });
  } catch (error) {
    console.error("[listarPremiosCliente]", error);
    return res.status(500).json({
      ok: false,
      message: "Error al listar premios de clientes",
      error: error.message,
    });
  }
};

export const obtenerPremioClientePorId = async (req, res) => {
  try {
    const { id } = req.params;

    const premio = await PremioCliente.findByPk(id, {
      include: [
        {
          model: CampaniaFidelizacion,
          as: "campania",
          required: false,
        },
      ],
    });

    if (!premio) {
      return res.status(404).json({
        ok: false,
        message: "Premio no encontrado",
      });
    }

    return res.json({
      ok: true,
      data: premio,
    });
  } catch (error) {
    console.error("[obtenerPremioClientePorId]", error);
    return res.status(500).json({
      ok: false,
      message: "Error al obtener premio",
      error: error.message,
    });
  }
};

export const crearPremioCliente = async (req, res) => {
  try {
    const {
      campania_id,
      articulo_id,
      nombre,
      descripcion,
      tipo_premio,
      valor,
      probabilidad,
      prioridad,
      stock_total,
      stock_diario,
      ilimitado,
      vence_cupon,
      dias_vencimiento_cupon,
      puntos_otorga_comercio,
      estado,
    } = req.body;

    if (!campania_id || !nombre || !tipo_premio) {
      return res.status(400).json({
        ok: false,
        message: "Los campos campania_id, nombre y tipo_premio son obligatorios",
      });
    }

    if (!TIPOS_PREMIO_VALIDOS.includes(tipo_premio)) {
      return res.status(400).json({
        ok: false,
        message: "tipo_premio inválido",
        tipos_validos: TIPOS_PREMIO_VALIDOS,
      });
    }

    const campania = await CampaniaFidelizacion.findByPk(campania_id);

    if (!campania) {
      return res.status(404).json({
        ok: false,
        message: "La campaña indicada no existe",
      });
    }

    const probabilidadNumber = Number(probabilidad ?? 0);

    if (Number.isNaN(probabilidadNumber) || probabilidadNumber < 0) {
      return res.status(400).json({
        ok: false,
        message: "La probabilidad debe ser un número mayor o igual a 0",
      });
    }

    if (probabilidadNumber > 100) {
      return res.status(400).json({
        ok: false,
        message: "La probabilidad no puede ser mayor a 100",
      });
    }

    const userId = req.user?.id || req.usuario?.id || null;

    const premio = await PremioCliente.create({
      campania_id,
      articulo_id: articulo_id || null,
      nombre,
      descripcion,
      tipo_premio,
      valor: valor ?? null,
      probabilidad: probabilidadNumber,
      prioridad: prioridad || 1,
      stock_total: stock_total ?? null,
      stock_diario: stock_diario ?? null,
      ilimitado: ilimitado ?? false,
      vence_cupon: vence_cupon ?? true,
      dias_vencimiento_cupon: dias_vencimiento_cupon ?? 7,
      puntos_otorga_comercio: puntos_otorga_comercio ?? 0,
      estado: estado || "activo",
      created_by: userId,
      updated_by: userId,
    });

    return res.status(201).json({
      ok: true,
      message: "Premio creado correctamente",
      data: premio,
    });
  } catch (error) {
    console.error("[crearPremioCliente]", error);
    return res.status(500).json({
      ok: false,
      message: "Error al crear premio",
      error: error.message,
    });
  }
};

export const actualizarPremioCliente = async (req, res) => {
  try {
    const { id } = req.params;

    const premio = await PremioCliente.findByPk(id);

    if (!premio) {
      return res.status(404).json({
        ok: false,
        message: "Premio no encontrado",
      });
    }

    const {
      campania_id,
      articulo_id,
      nombre,
      descripcion,
      tipo_premio,
      valor,
      probabilidad,
      prioridad,
      stock_total,
      stock_diario,
      ilimitado,
      vence_cupon,
      dias_vencimiento_cupon,
      puntos_otorga_comercio,
      estado,
    } = req.body;

    if (tipo_premio && !TIPOS_PREMIO_VALIDOS.includes(tipo_premio)) {
      return res.status(400).json({
        ok: false,
        message: "tipo_premio inválido",
        tipos_validos: TIPOS_PREMIO_VALIDOS,
      });
    }

    if (campania_id) {
      const campania = await CampaniaFidelizacion.findByPk(campania_id);

      if (!campania) {
        return res.status(404).json({
          ok: false,
          message: "La campaña indicada no existe",
        });
      }
    }

    let probabilidadFinal = premio.probabilidad;

    if (probabilidad !== undefined) {
      const probabilidadNumber = Number(probabilidad);

      if (
        Number.isNaN(probabilidadNumber) ||
        probabilidadNumber < 0 ||
        probabilidadNumber > 100
      ) {
        return res.status(400).json({
          ok: false,
          message: "La probabilidad debe estar entre 0 y 100",
        });
      }

      probabilidadFinal = probabilidadNumber;
    }

    const userId = req.user?.id || req.usuario?.id || null;

    await premio.update({
      campania_id: campania_id ?? premio.campania_id,
      articulo_id: articulo_id ?? premio.articulo_id,
      nombre: nombre ?? premio.nombre,
      descripcion: descripcion ?? premio.descripcion,
      tipo_premio: tipo_premio ?? premio.tipo_premio,
      valor: valor ?? premio.valor,
      probabilidad: probabilidadFinal,
      prioridad: prioridad ?? premio.prioridad,
      stock_total: stock_total ?? premio.stock_total,
      stock_diario: stock_diario ?? premio.stock_diario,
      ilimitado: ilimitado ?? premio.ilimitado,
      vence_cupon: vence_cupon ?? premio.vence_cupon,
      dias_vencimiento_cupon:
        dias_vencimiento_cupon ?? premio.dias_vencimiento_cupon,
      puntos_otorga_comercio:
        puntos_otorga_comercio ?? premio.puntos_otorga_comercio,
      estado: estado ?? premio.estado,
      updated_by: userId,
    });

    return res.json({
      ok: true,
      message: "Premio actualizado correctamente",
      data: premio,
    });
  } catch (error) {
    console.error("[actualizarPremioCliente]", error);
    return res.status(500).json({
      ok: false,
      message: "Error al actualizar premio",
      error: error.message,
    });
  }
};

export const pausarPremioCliente = async (req, res) => {
  try {
    const { id } = req.params;

    const premio = await PremioCliente.findByPk(id);

    if (!premio) {
      return res.status(404).json({
        ok: false,
        message: "Premio no encontrado",
      });
    }

    const userId = req.user?.id || req.usuario?.id || null;

    await premio.update({
      estado: "pausado",
      updated_by: userId,
    });

    return res.json({
      ok: true,
      message: "Premio pausado correctamente",
      data: premio,
    });
  } catch (error) {
    console.error("[pausarPremioCliente]", error);
    return res.status(500).json({
      ok: false,
      message: "Error al pausar premio",
      error: error.message,
    });
  }
};

export const activarPremioCliente = async (req, res) => {
  try {
    const { id } = req.params;

    const premio = await PremioCliente.findByPk(id);

    if (!premio) {
      return res.status(404).json({
        ok: false,
        message: "Premio no encontrado",
      });
    }

    const userId = req.user?.id || req.usuario?.id || null;

    await premio.update({
      estado: "activo",
      updated_by: userId,
    });

    return res.json({
      ok: true,
      message: "Premio activado correctamente",
      data: premio,
    });
  } catch (error) {
    console.error("[activarPremioCliente]", error);
    return res.status(500).json({
      ok: false,
      message: "Error al activar premio",
      error: error.message,
    });
  }
};