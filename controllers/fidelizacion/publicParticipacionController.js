import { sequelize } from "../../config/database.js";
import {
  ComercioQr,
  ComercioAsociado,
  ClienteFidelizacion,
  ParticipacionCliente,
} from "../../models/fidelizacion/index.js";

import { obtenerCampaniaActivaGeneral } from "../../services/fidelizacion/campaignResolverService.js";
import { validarUbicacionCliente } from "../../services/fidelizacion/geoValidationService.js";
import {
  normalizarTelefono,
  validarParticipacionDiaria,
} from "../../services/fidelizacion/fraudDetectionService.js";
import { seleccionarPremioRuleta } from "../../services/fidelizacion/rouletteService.js";
import { crearCuponParaPremio } from "../../services/fidelizacion/couponService.js";
import { ejecutarAnalisisBasicoFraude } from "../../services/fidelizacion/fraudAlertService.js";

const getClientIp = (req) => {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    req.ip ||
    null
  );
};

const registrarBloqueo = async ({
  comercio_id,
  campania_id = null,
  resultado = "bloqueado",
  estado = "bloqueada",
  motivo_bloqueo,
  device_id,
  req,
  lat_cliente,
  lon_cliente,
  precision_gps,
  distancia_metros = null,
  telefono_ingresado,
  nombre_ingresado,
  transaction,
}) => {
  const participacion = await ParticipacionCliente.create(
    {
      comercio_id,
      campania_id,
      resultado,
      estado,
      motivo_bloqueo,
      device_id,
      ip: getClientIp(req),
      user_agent: req.headers["user-agent"] || null,
      lat_cliente,
      lon_cliente,
      precision_gps,
      distancia_metros,
      telefono_ingresado,
      nombre_ingresado,
      fecha_participacion: new Date(),
    },
    { transaction }
  );

  await ejecutarAnalisisBasicoFraude({
    participacion,
    transaction,
  });

  return participacion;
};

export const registrarParticipacionPublica = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const {
      token,
      nombre,
      telefono,
      device_id,
      lat_cliente,
      lon_cliente,
      precision_gps,
    } = req.body;

    if (!token || !nombre || !telefono) {
      await transaction.rollback();
      return res.status(400).json({
        ok: false,
        message: "Token, nombre y teléfono son obligatorios",
      });
    }

    if (!device_id) {
      await transaction.rollback();
      return res.status(400).json({
        ok: false,
        message: "No se pudo identificar el dispositivo",
      });
    }

    const telefonoNormalizado = normalizarTelefono(telefono);

    if (!telefonoNormalizado || telefonoNormalizado.length < 8) {
      await transaction.rollback();
      return res.status(400).json({
        ok: false,
        message: "El teléfono ingresado no es válido",
      });
    }

    const qr = await ComercioQr.findOne({
      where: {
        token,
        estado: "activo",
      },
      include: [
        {
          model: ComercioAsociado,
          as: "comercio",
          required: true,
        },
      ],
      transaction,
    });

    if (!qr) {
      await transaction.rollback();
      return res.status(404).json({
        ok: false,
        code: "QR_INVALIDO",
        message: "El QR no existe o ya no está activo",
      });
    }

    const comercio = qr.comercio;

    if (!comercio.habilitado || comercio.estado !== "activo") {
      await registrarBloqueo({
        comercio_id: comercio.id,
        motivo_bloqueo: "comercio_inactivo",
        device_id,
        req,
        lat_cliente,
        lon_cliente,
        precision_gps,
        telefono_ingresado: telefonoNormalizado,
        nombre_ingresado: nombre,
        transaction,
      });

      await transaction.commit();

      return res.status(403).json({
        ok: false,
        code: "COMERCIO_INACTIVO",
        message: "Este comercio no está habilitado para participar",
      });
    }

    const campania = await obtenerCampaniaActivaGeneral();

    if (!campania) {
      await registrarBloqueo({
        comercio_id: comercio.id,
        motivo_bloqueo: "campania_inactiva",
        device_id,
        req,
        lat_cliente,
        lon_cliente,
        precision_gps,
        telefono_ingresado: telefonoNormalizado,
        nombre_ingresado: nombre,
        transaction,
      });

      await transaction.commit();

      return res.status(404).json({
        ok: false,
        code: "SIN_CAMPANIA_ACTIVA",
        message: "No hay campaña activa en este momento",
      });
    }

    const geoValidation = validarUbicacionCliente({
      comercio,
      lat_cliente,
      lon_cliente,
      precision_gps,
    });

    if (!geoValidation.ok) {
      await registrarBloqueo({
        comercio_id: comercio.id,
        campania_id: campania.id,
        motivo_bloqueo: geoValidation.motivo,
        device_id,
        req,
        lat_cliente,
        lon_cliente,
        precision_gps,
        distancia_metros: geoValidation.distancia_metros,
        telefono_ingresado: telefonoNormalizado,
        nombre_ingresado: nombre,
        transaction,
      });

      await transaction.commit();

      return res.status(403).json({
        ok: false,
        code: geoValidation.motivo,
        message: geoValidation.message,
      });
    }

    const fraudValidation = await validarParticipacionDiaria({
      comercio,
      telefono_normalizado: telefonoNormalizado,
      device_id,
    });

    if (!fraudValidation.ok) {
      await registrarBloqueo({
        comercio_id: comercio.id,
        campania_id: campania.id,
        motivo_bloqueo: fraudValidation.motivo,
        device_id,
        req,
        lat_cliente,
        lon_cliente,
        precision_gps,
        distancia_metros: geoValidation.distancia_metros,
        telefono_ingresado: telefonoNormalizado,
        nombre_ingresado: nombre,
        transaction,
      });

      await transaction.commit();

      return res.status(409).json({
        ok: false,
        code: fraudValidation.motivo,
        message: fraudValidation.message,
      });
    }

    const [cliente] = await ClienteFidelizacion.findOrCreate({
      where: {
        telefono_normalizado: telefonoNormalizado,
      },
      defaults: {
        nombre,
        telefono,
        telefono_normalizado: telefonoNormalizado,
        estado: "activo",
      },
      transaction,
    });

    if (cliente.nombre !== nombre || cliente.telefono !== telefono) {
      await cliente.update(
        {
          nombre,
          telefono,
        },
        { transaction }
      );
    }

    const resultadoRuleta = await seleccionarPremioRuleta({
      campania_id: campania.id,
      transaction,
    });

    const participacion = await ParticipacionCliente.create(
      {
        cliente_id: cliente.id,
        comercio_id: comercio.id,
        campania_id: campania.id,
        premio_cliente_id: resultadoRuleta.premio?.id || null,
        cupon_id: null,
        resultado: resultadoRuleta.resultado,
        estado: "procesada",
        motivo_bloqueo:
          resultadoRuleta.motivo === "premios_agotados"
            ? "premios_agotados"
            : null,
        device_id,
        ip: getClientIp(req),
        user_agent: req.headers["user-agent"] || null,
        lat_cliente,
        lon_cliente,
        precision_gps,
        distancia_metros: geoValidation.distancia_metros,
        telefono_ingresado: telefonoNormalizado,
        nombre_ingresado: nombre,
        fecha_participacion: new Date(),
      },
      { transaction }
    );

    let cupon = null;

    if (resultadoRuleta.gano && resultadoRuleta.premio) {
      cupon = await crearCuponParaPremio({
        cliente_id: cliente.id,
        participacion_id: participacion.id,
        comercio_id: comercio.id,
        campania_id: campania.id,
        premio: resultadoRuleta.premio,
        transaction,
      });

      await participacion.update(
        {
          cupon_id: cupon.id,
        },
        { transaction }
      );
    }

    await transaction.commit();

    return res.status(201).json({
      ok: true,
      message: resultadoRuleta.gano
        ? "¡Felicitaciones! Ganaste un premio."
        : "Gracias por participar. Seguí intentando.",
      data: {
        cliente: {
          id: cliente.id,
          nombre: cliente.nombre,
          telefono: cliente.telefono,
        },
        comercio: {
          id: comercio.id,
          nombre_fantasia: comercio.nombre_fantasia,
          domicilio: comercio.domicilio,
        },
        campania: {
          id: campania.id,
          nombre: campania.nombre,
        },
        participacion: {
          id: participacion.id,
          estado: participacion.estado,
          resultado: participacion.resultado,
          distancia_metros: participacion.distancia_metros,
        },
        premio: resultadoRuleta.premio
          ? {
              id: resultadoRuleta.premio.id,
              nombre: resultadoRuleta.premio.nombre,
              descripcion: resultadoRuleta.premio.descripcion,
              tipo_premio: resultadoRuleta.premio.tipo_premio,
              valor: resultadoRuleta.premio.valor,
              puntos_otorga_comercio:
                resultadoRuleta.premio.puntos_otorga_comercio,
            }
          : null,
        cupon: cupon
          ? {
              id: cupon.id,
              numero_cupon: cupon.numero_cupon,
              token: cupon.token,
              estado: cupon.estado,
              fecha_emision: cupon.fecha_emision,
              fecha_vencimiento: cupon.fecha_vencimiento,
              qr_url: cupon.qr_url,
              codigo_validacion: cupon.codigo_validacion,
            }
          : null,
      },
    });
  } catch (error) {
    await transaction.rollback();

    console.error("[registrarParticipacionPublica]", error);

    return res.status(500).json({
      ok: false,
      message: "Error al registrar participación",
      error: error.message,
    });
  }
};