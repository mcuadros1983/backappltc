import {
  ComercioQr,
  ComercioAsociado,
} from "../../models/fidelizacion/index.js";

import { obtenerCampaniaActivaGeneral } from "../../services/fidelizacion/campaignResolverService.js";

export const validarQrPublico = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        ok: false,
        message: "Token QR requerido",
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
    });

    if (!qr) {
      return res.status(404).json({
        ok: false,
        code: "QR_INVALIDO",
        message: "El QR no existe o ya no está activo",
      });
    }

    const comercio = qr.comercio;

    if (!comercio) {
      return res.status(404).json({
        ok: false,
        code: "COMERCIO_NO_ENCONTRADO",
        message: "No se encontró el comercio asociado al QR",
      });
    }

    if (!comercio.habilitado || comercio.estado !== "activo") {
      return res.status(403).json({
        ok: false,
        code: "COMERCIO_INACTIVO",
        message: "Este comercio no se encuentra habilitado para participar",
      });
    }

    const campania = await obtenerCampaniaActivaGeneral();

    if (!campania) {
      return res.status(404).json({
        ok: false,
        code: "SIN_CAMPANIA_ACTIVA",
        message: "No hay una campaña activa en este momento",
      });
    }

    return res.json({
      ok: true,
      message: "QR válido",
      data: {
        qr: {
          id: qr.id,
          token: qr.token,
          estado: qr.estado,
          url: qr.url,
        },
        comercio: {
          id: comercio.id,
          nombre_fantasia: comercio.nombre_fantasia,
          domicilio: comercio.domicilio,
          radio_metros: comercio.radio_metros,
          lat: comercio.lat,
          lon: comercio.lon,
          permite_multiples_participaciones:
            comercio.permite_multiples_participaciones,
          limite_participaciones_diarias:
            comercio.limite_participaciones_diarias,
        },
        campania: {
          id: campania.id,
          nombre: campania.nombre,
          descripcion: campania.descripcion,
          fecha_inicio: campania.fecha_inicio,
          fecha_fin: campania.fecha_fin,
        },
      },
    });
  } catch (error) {
    console.error("[validarQrPublico]", error);

    return res.status(500).json({
      ok: false,
      message: "Error al validar QR público",
      error: error.message,
    });
  }
};