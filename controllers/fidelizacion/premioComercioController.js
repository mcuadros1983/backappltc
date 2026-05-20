import {
  PremioComercio,
  CanjePremioComercio,
  PuntoComercioMovimiento,
  ComercioAsociado,
} from "../../models/fidelizacion/index.js";
import { sequelize } from "../../config/database.js";
import { obtenerSaldoPuntosComercio } from "../../services/fidelizacion/pointsService.js";

const ESTADOS_CANJE_SOLICITABLES = ["solicitado", "pendiente"];
const ESTADOS_RESERVAN_STOCK = ["solicitado", "pendiente", "aprobado", "entregado"];

const getUserId = (req) => {
  return req.user?.id || req.usuario?.id || req.user?.usuario || null;
};

const toPositiveInt = (value, defaultValue = 0) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return defaultValue;
  return Math.max(0, Math.trunc(number));
};

const buildPremioPayload = (body, userId, isUpdate = false) => {
  const payload = {};

  const allowedFields = [
    "nombre",
    "descripcion",
    "tipo_premio",
    "costo_puntos",
    "stock_total",
    "ilimitado",
    "estado",
    "imagen_url",
  ];

  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      payload[field] = body[field];
    }
  }

  if (payload.costo_puntos !== undefined) {
    payload.costo_puntos = toPositiveInt(payload.costo_puntos);
  }

  if (payload.stock_total !== undefined) {
    payload.stock_total =
      payload.stock_total === null || payload.stock_total === ""
        ? null
        : toPositiveInt(payload.stock_total);
  }

  if (payload.ilimitado !== undefined) {
    payload.ilimitado = Boolean(payload.ilimitado);
    if (payload.ilimitado) payload.stock_total = null;
  }

  if (isUpdate) {
    payload.updated_by = userId;
  } else {
    payload.created_by = userId;
    payload.updated_by = userId;
  }

  return payload;
};

export const listarPremiosComercioAdmin = async (req, res) => {
  try {
    const premios = await PremioComercio.findAll({
      order: [["createdAt", "DESC"]],
    });

    return res.json({ ok: true, data: premios });
  } catch (error) {
    console.error("[listarPremiosComercioAdmin]", error);
    return res.status(500).json({
      ok: false,
      message: "Error al listar premios para comercios",
      error: error.message,
    });
  }
};

export const crearPremioComercioAdmin = async (req, res) => {
  try {
    const userId = getUserId(req);
    const payload = buildPremioPayload(req.body, userId, false);

    if (!payload.nombre) {
      return res.status(400).json({
        ok: false,
        message: "El nombre del premio es obligatorio",
      });
    }

    if (!payload.costo_puntos || payload.costo_puntos <= 0) {
      return res.status(400).json({
        ok: false,
        message: "El costo en puntos debe ser mayor a 0",
      });
    }

    if (!payload.ilimitado && !payload.stock_total) {
      return res.status(400).json({
        ok: false,
        message: "Si el premio no es ilimitado, debe indicar stock_total",
      });
    }

    const premio = await PremioComercio.create(payload);

    return res.status(201).json({
      ok: true,
      message: "Premio para comercio creado correctamente",
      data: premio,
    });
  } catch (error) {
    console.error("[crearPremioComercioAdmin]", error);
    return res.status(500).json({
      ok: false,
      message: "Error al crear premio para comercio",
      error: error.message,
    });
  }
};

export const actualizarPremioComercioAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const premio = await PremioComercio.findByPk(id);

    if (!premio) {
      return res.status(404).json({
        ok: false,
        message: "Premio no encontrado",
      });
    }

    const userId = getUserId(req);
    const payload = buildPremioPayload(req.body, userId, true);

    if (payload.nombre !== undefined && !payload.nombre) {
      return res.status(400).json({
        ok: false,
        message: "El nombre del premio no puede estar vacío",
      });
    }

    if (
      payload.costo_puntos !== undefined &&
      (!payload.costo_puntos || payload.costo_puntos <= 0)
    ) {
      return res.status(400).json({
        ok: false,
        message: "El costo en puntos debe ser mayor a 0",
      });
    }

    const ilimitadoFinal =
      payload.ilimitado !== undefined ? payload.ilimitado : premio.ilimitado;

    const stockFinal =
      payload.stock_total !== undefined ? payload.stock_total : premio.stock_total;

    if (!ilimitadoFinal && !stockFinal) {
      return res.status(400).json({
        ok: false,
        message: "Si el premio no es ilimitado, debe indicar stock_total",
      });
    }

    await premio.update(payload);

    return res.json({
      ok: true,
      message: "Premio actualizado correctamente",
      data: premio,
    });
  } catch (error) {
    console.error("[actualizarPremioComercioAdmin]", error);
    return res.status(500).json({
      ok: false,
      message: "Error al actualizar premio",
      error: error.message,
    });
  }
};

export const listarPremiosComercioPortal = async (req, res) => {
  try {
    const comercio_id = req.comercioPortal.comercio_id;
    const saldo = await obtenerSaldoPuntosComercio(comercio_id);

    const premios = await PremioComercio.findAll({
      where: { estado: "activo" },
      order: [
        ["costo_puntos", "ASC"],
        ["nombre", "ASC"],
      ],
    });

    return res.json({
      ok: true,
      data: {
        saldo,
        premios,
      },
    });
  } catch (error) {
    console.error("[listarPremiosComercioPortal]", error);
    return res.status(500).json({
      ok: false,
      message: "Error al obtener premios disponibles",
      error: error.message,
    });
  }
};

export const solicitarCanjePremioComercioPortal = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const comercio_id = req.comercioPortal.comercio_id;
    const { premio_comercio_id, observaciones } = req.body;

    if (!premio_comercio_id) {
      await transaction.rollback();
      return res.status(400).json({
        ok: false,
        message: "Debe indicar el premio a canjear",
      });
    }

    const premio = await PremioComercio.findByPk(premio_comercio_id, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!premio || premio.estado !== "activo") {
      await transaction.rollback();
      return res.status(404).json({
        ok: false,
        message: "Premio no disponible",
      });
    }

    const costoPuntos = Number(premio.costo_puntos || 0);

    if (costoPuntos <= 0) {
      await transaction.rollback();
      return res.status(409).json({
        ok: false,
        message: "El premio no tiene un costo de puntos válido",
      });
    }

    if (!premio.ilimitado && premio.stock_total !== null) {
      const canjesReservados = await CanjePremioComercio.count({
        where: {
          premio_comercio_id: premio.id,
          estado: ESTADOS_RESERVAN_STOCK,
        },
        transaction,
      });

      if (canjesReservados >= Number(premio.stock_total)) {
        await transaction.rollback();
        return res.status(409).json({
          ok: false,
          message: "El premio ya no tiene stock disponible",
        });
      }
    }

    const saldo = await obtenerSaldoPuntosComercio(comercio_id);

    if (saldo < costoPuntos) {
      await transaction.rollback();
      return res.status(409).json({
        ok: false,
        message: "Puntos insuficientes para solicitar este premio",
      });
    }

    const canje = await CanjePremioComercio.create(
      {
        comercio_id,
        premio_comercio_id: premio.id,
        puntos_requeridos: costoPuntos,
        estado: "solicitado",
        fecha_solicitud: new Date(),
        observaciones: observaciones || null,
      },
      { transaction }
    );

    const movimiento = await PuntoComercioMovimiento.create(
      {
        comercio_id,
        canje_premio_comercio_id: canje.id,
        tipo_movimiento: "debito_canje",
        puntos: -Math.abs(costoPuntos),
        fecha_movimiento: new Date(),
        estado: "activo",
        motivo: `Solicitud de canje de premio comercio: ${premio.nombre}`,
      },
      { transaction }
    );

    await transaction.commit();

    return res.status(201).json({
      ok: true,
      message: "Solicitud de canje realizada correctamente",
      data: {
        canje,
        movimiento,
      },
    });
  } catch (error) {
    await transaction.rollback();

    console.error("[solicitarCanjePremioComercioPortal]", error);
    return res.status(500).json({
      ok: false,
      message: "Error al solicitar canje",
      error: error.message,
    });
  }
};

export const listarCanjesPremioComercioPortal = async (req, res) => {
  try {
    const comercio_id = req.comercioPortal.comercio_id;

    const canjes = await CanjePremioComercio.findAll({
      where: { comercio_id },
      include: [{ model: PremioComercio, as: "premio" }],
      order: [["createdAt", "DESC"]],
    });

    return res.json({ ok: true, data: canjes });
  } catch (error) {
    console.error("[listarCanjesPremioComercioPortal]", error);
    return res.status(500).json({
      ok: false,
      message: "Error al listar canjes del comercio",
      error: error.message,
    });
  }
};

export const listarCanjesPremioComercioAdmin = async (req, res) => {
  try {
    const canjes = await CanjePremioComercio.findAll({
      include: [
        { model: PremioComercio, as: "premio" },
        {
          model: ComercioAsociado,
          as: "comercio",
          required: false,
          attributes: ["id", "nombre_fantasia", "razon_social", "documento_numero"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    return res.json({ ok: true, data: canjes });
  } catch (error) {
    console.error("[listarCanjesPremioComercioAdmin]", error);
    return res.status(500).json({
      ok: false,
      message: "Error al listar canjes de comercios",
      error: error.message,
    });
  }
};

export const aprobarCanjePremioComercioAdmin = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const userId = getUserId(req);

    const canje = await CanjePremioComercio.findByPk(id, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!canje) {
      await transaction.rollback();
      return res.status(404).json({
        ok: false,
        message: "Canje no encontrado",
      });
    }

    if (!ESTADOS_CANJE_SOLICITABLES.includes(canje.estado)) {
      await transaction.rollback();
      return res.status(409).json({
        ok: false,
        message: `No se puede aprobar un canje en estado '${canje.estado}'`,
      });
    }

    await canje.update(
      {
        estado: "aprobado",
        fecha_aprobacion: new Date(),
        aprobado_por: userId,
      },
      { transaction }
    );

    await transaction.commit();

    return res.json({
      ok: true,
      message: "Canje aprobado correctamente",
      data: canje,
    });
  } catch (error) {
    await transaction.rollback();

    console.error("[aprobarCanjePremioComercioAdmin]", error);
    return res.status(500).json({
      ok: false,
      message: "Error al aprobar canje",
      error: error.message,
    });
  }
};

export const rechazarCanjePremioComercioAdmin = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const { motivo_rechazo } = req.body;
    const userId = getUserId(req);

    const canje = await CanjePremioComercio.findByPk(id, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!canje) {
      await transaction.rollback();
      return res.status(404).json({
        ok: false,
        message: "Canje no encontrado",
      });
    }

    if (!ESTADOS_CANJE_SOLICITABLES.includes(canje.estado)) {
      await transaction.rollback();
      return res.status(409).json({
        ok: false,
        message: `No se puede rechazar un canje en estado '${canje.estado}'`,
      });
    }

    const devolucionExistente = await PuntoComercioMovimiento.findOne({
      where: {
        comercio_id: canje.comercio_id,
        canje_premio_comercio_id: canje.id,
        tipo_movimiento: "devolucion",
        estado: "activo",
      },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (devolucionExistente) {
      await transaction.rollback();
      return res.status(409).json({
        ok: false,
        message: "Este canje ya tiene una devolución de puntos registrada",
      });
    }

    await canje.update(
      {
        estado: "rechazado",
        rechazado_por: userId,
        motivo_rechazo: motivo_rechazo || "Rechazado por administración",
      },
      { transaction }
    );

    const movimiento = await PuntoComercioMovimiento.create(
      {
        comercio_id: canje.comercio_id,
        canje_premio_comercio_id: canje.id,
        tipo_movimiento: "devolucion",
        puntos: Math.abs(Number(canje.puntos_requeridos || 0)),
        fecha_movimiento: new Date(),
        estado: "activo",
        motivo: `Devolución por rechazo de canje comercio #${canje.id}`,
        created_by: userId,
      },
      { transaction }
    );

    await transaction.commit();

    return res.json({
      ok: true,
      message: "Canje rechazado y puntos devueltos correctamente",
      data: {
        canje,
        movimiento,
      },
    });
  } catch (error) {
    await transaction.rollback();

    console.error("[rechazarCanjePremioComercioAdmin]", error);
    return res.status(500).json({
      ok: false,
      message: "Error al rechazar canje",
      error: error.message,
    });
  }
};

export const entregarCanjePremioComercioAdmin = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;

    const canje = await CanjePremioComercio.findByPk(id, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!canje) {
      await transaction.rollback();
      return res.status(404).json({
        ok: false,
        message: "Canje no encontrado",
      });
    }

    if (canje.estado !== "aprobado") {
      await transaction.rollback();
      return res.status(409).json({
        ok: false,
        message: `Solo se pueden entregar canjes aprobados. Estado actual: '${canje.estado}'`,
      });
    }

    await canje.update(
      {
        estado: "entregado",
        fecha_entrega: new Date(),
      },
      { transaction }
    );

    await transaction.commit();

    return res.json({
      ok: true,
      message: "Canje marcado como entregado",
      data: canje,
    });
  } catch (error) {
    await transaction.rollback();

    console.error("[entregarCanjePremioComercioAdmin]", error);
    return res.status(500).json({
      ok: false,
      message: "Error al entregar canje",
      error: error.message,
    });
  }
};