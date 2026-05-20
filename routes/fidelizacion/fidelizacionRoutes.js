import express from "express";

import {
  listarComerciosAsociados,
  obtenerComercioAsociadoPorId,
  crearComercioAsociado,
  actualizarComercioAsociado,
  suspenderComercioAsociado,
  activarComercioAsociado,
  generarQrComercioAsociado,
  obtenerQrComercioAsociado,
} from "../../controllers/fidelizacion/comercioAsociadoController.js";

import {
  listarCampaniasFidelizacion,
  obtenerCampaniaFidelizacionPorId,
  crearCampaniaFidelizacion,
  actualizarCampaniaFidelizacion,
  activarCampaniaFidelizacion,
  pausarCampaniaFidelizacion,
  finalizarCampaniaFidelizacion,
} from "../../controllers/fidelizacion/campaniaFidelizacionController.js";

import {
  listarPremiosCliente,
  obtenerPremioClientePorId,
  crearPremioCliente,
  actualizarPremioCliente,
  pausarPremioCliente,
  activarPremioCliente,
} from "../../controllers/fidelizacion/premioClienteController.js";

import {
  ComercioQr,
  ComercioAsociado,
} from "../../models/fidelizacion/index.js";

import { obtenerCampaniaActivaGeneral } from "../../services/fidelizacion/campaignResolverService.js";

import { registrarParticipacionPublica } from "../../controllers/fidelizacion/publicParticipacionController.js";
import { obtenerCuponPublicoPorToken } from "../../controllers/fidelizacion/publicCuponController.js";

import {
  validarCuponAdmin,
  canjearCuponAdmin,
  obtenerPuntosComercioAdmin,
} from "../../controllers/fidelizacion/canjeCuponClienteController.js";

import { obtenerDashboardFidelizacion } from "../../controllers/fidelizacion/dashboardFidelizacionController.js";

import {
  loginPortalComercio,
  authComercioPortalMiddleware,
  obtenerPerfilComercioPortal,
  obtenerPuntosPortalComercio,
} from "../../controllers/fidelizacion/portalComercioController.js";

import {
  listarPremiosComercioAdmin,
  crearPremioComercioAdmin,
  actualizarPremioComercioAdmin,
  listarPremiosComercioPortal,
  solicitarCanjePremioComercioPortal,
  listarCanjesPremioComercioPortal,
  listarCanjesPremioComercioAdmin,
  aprobarCanjePremioComercioAdmin,
  rechazarCanjePremioComercioAdmin,
  entregarCanjePremioComercioAdmin,
} from "../../controllers/fidelizacion/premioComercioController.js";


import {
  listarCuponesClienteAdmin,
  obtenerCuponClienteAdmin,
  listarCanjesCuponesAdmin,
  obtenerCanjeCuponClienteAdmin,
} from "../../controllers/fidelizacion/cuponClienteController.js";

import {
  listarClientesFidelizacionAdmin,
  obtenerClienteFidelizacionAdmin,
} from "../../controllers/fidelizacion/clienteFidelizacionController.js";

import { ejecutarJobsFidelizacionManual } from "../../controllers/fidelizacion/fidelizacionJobsController.js";

import {
  listarAlertasFraude,
  actualizarEstadoAlertaFraude,
} from "../../controllers/fidelizacion/alertaFraudeController.js";

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

const router = express.Router();

router.get("/health", (req, res) => {
  res.json({
    ok: true,
    modulo: "fidelizacion",
    message: "Módulo de fidelización activo",
  });
});

/**
 * PUBLIC - QR cliente
 */
router.get("/public/qr/:token", validarQrPublico);
router.post("/public/participar", registrarParticipacionPublica);
router.get("/public/cupon/:token", obtenerCuponPublicoPorToken);
/**
 * ADMIN - Comercios asociados
 */

router.get("/admin/comercios", listarComerciosAsociados);
router.get("/admin/comercios/:id", obtenerComercioAsociadoPorId);
router.post("/admin/comercios", crearComercioAsociado);
router.put("/admin/comercios/:id", actualizarComercioAsociado);
router.patch("/admin/comercios/:id/suspender", suspenderComercioAsociado);
router.patch("/admin/comercios/:id/activar", activarComercioAsociado);
router.post("/admin/comercios/:id/generar-qr", generarQrComercioAsociado);
router.get("/admin/comercios/:id/qr", obtenerQrComercioAsociado);

/**
 * ADMIN - Campañas fidelización
 */

router.get("/admin/campanias", listarCampaniasFidelizacion);
router.get("/admin/campanias/:id", obtenerCampaniaFidelizacionPorId);
router.post("/admin/campanias", crearCampaniaFidelizacion);
router.put("/admin/campanias/:id", actualizarCampaniaFidelizacion);
router.patch("/admin/campanias/:id/activar", activarCampaniaFidelizacion);
router.patch("/admin/campanias/:id/pausar", pausarCampaniaFidelizacion);
router.patch("/admin/campanias/:id/finalizar", finalizarCampaniaFidelizacion);

/**
 * ADMIN - Premios clientes
 */

router.get("/admin/premios-clientes", listarPremiosCliente);
router.get("/admin/premios-clientes/:id", obtenerPremioClientePorId);
router.post("/admin/premios-clientes", crearPremioCliente);
router.put("/admin/premios-clientes/:id", actualizarPremioCliente);
router.patch("/admin/premios-clientes/:id/pausar", pausarPremioCliente);
router.patch("/admin/premios-clientes/:id/activar", activarPremioCliente);

/**
 * ADMIN - Cupones, canjes y clientes
 */

router.get("/admin/cupones", listarCuponesClienteAdmin);
router.get("/admin/cupones/:id", obtenerCuponClienteAdmin);
router.get("/admin/canjes-cupones", listarCanjesCuponesAdmin);
router.get("/admin/canjes-cupones/:id", obtenerCanjeCuponClienteAdmin);
router.get("/admin/clientes", listarClientesFidelizacionAdmin);
router.get("/admin/clientes/:id", obtenerClienteFidelizacionAdmin);

/**
 * ADMIN - Validación y canje de cupones
 */

router.post("/admin/cupones/validar", validarCuponAdmin);
router.post("/admin/cupones/:id/canjear", canjearCuponAdmin);

/**
 * ADMIN - Puntos comercio
 */

router.get("/admin/comercios/:id/puntos", obtenerPuntosComercioAdmin);

router.get("/admin/dashboard", obtenerDashboardFidelizacion);

/**
 * PORTAL COMERCIO
 */

router.post("/comercio/login", loginPortalComercio);

router.get(
  "/comercio/me",
  authComercioPortalMiddleware,
  obtenerPerfilComercioPortal
);

router.get(
  "/comercio/puntos",
  authComercioPortalMiddleware,
  obtenerPuntosPortalComercio
);

router.get("/admin/premios-comercios", listarPremiosComercioAdmin);
router.post("/admin/premios-comercios", crearPremioComercioAdmin);
router.put("/admin/premios-comercios/:id", actualizarPremioComercioAdmin);

router.get("/admin/canjes-comercios", listarCanjesPremioComercioAdmin);
router.patch("/admin/canjes-comercios/:id/aprobar", aprobarCanjePremioComercioAdmin);
router.patch("/admin/canjes-comercios/:id/rechazar", rechazarCanjePremioComercioAdmin);
router.patch("/admin/canjes-comercios/:id/entregar", entregarCanjePremioComercioAdmin);

router.get(
  "/comercio/premios",
  authComercioPortalMiddleware,
  listarPremiosComercioPortal
);

router.post(
  "/comercio/canjes",
  authComercioPortalMiddleware,
  solicitarCanjePremioComercioPortal
);

router.get(
  "/comercio/canjes",
  authComercioPortalMiddleware,
  listarCanjesPremioComercioPortal
);

router.post("/admin/jobs/run", ejecutarJobsFidelizacionManual);

router.get("/admin/alertas-fraude", listarAlertasFraude);

router.patch(
  "/admin/alertas-fraude/:id/estado",
  actualizarEstadoAlertaFraude
);

export default router;