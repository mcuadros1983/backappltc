import { PuntoComercioMovimiento } from "../../models/fidelizacion/index.js";
import {
  validarLoginComercio,
  verificarTokenComercio,
} from "../../services/fidelizacion/commercePortalAuthService.js";
import { obtenerSaldoPuntosComercio } from "../../services/fidelizacion/pointsService.js";

export const loginPortalComercio = async (req, res) => {
  try {
    const { documento_numero, telefono } = req.body;

    const result = await validarLoginComercio({
      documento_numero,
      telefono,
    });

    if (!result.ok) {
      return res.status(result.status).json({
        ok: false,
        message: result.message,
      });
    }

    return res.json({
      ok: true,
      message: "Login correcto",
      data: {
        token: result.token,
        comercio: {
          id: result.comercio.id,
          nombre_fantasia: result.comercio.nombre_fantasia,
          razon_social: result.comercio.razon_social,
          documento_tipo: result.comercio.documento_tipo,
          documento_numero: result.comercio.documento_numero,
          domicilio: result.comercio.domicilio,
          telefono: result.comercio.telefono,
        },
      },
    });
  } catch (error) {
    console.error("[loginPortalComercio]", error);

    return res.status(500).json({
      ok: false,
      message: "Error al iniciar sesión del comercio",
      error: error.message,
    });
  }
};

export const authComercioPortalMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.replace("Bearer ", "")
      : null;

    if (!token) {
      return res.status(401).json({
        ok: false,
        message: "Token de comercio requerido",
      });
    }

    const decoded = verificarTokenComercio(token);

    if (decoded.tipo !== "comercio_fidelizacion") {
      return res.status(401).json({
        ok: false,
        message: "Token inválido para portal comercio",
      });
    }

    req.comercioPortal = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      ok: false,
      message: "Sesión del comercio inválida o vencida",
    });
  }
};

export const obtenerPerfilComercioPortal = async (req, res) => {
  try {
    const comercio_id = req.comercioPortal.comercio_id;

    const saldo = await obtenerSaldoPuntosComercio(comercio_id);

    return res.json({
      ok: true,
      data: {
        comercio_id,
        saldo,
      },
    });
  } catch (error) {
    console.error("[obtenerPerfilComercioPortal]", error);

    return res.status(500).json({
      ok: false,
      message: "Error al obtener perfil del comercio",
      error: error.message,
    });
  }
};

export const obtenerPuntosPortalComercio = async (req, res) => {
  try {
    const comercio_id = req.comercioPortal.comercio_id;

    const movimientos = await PuntoComercioMovimiento.findAll({
      where: {
        comercio_id,
      },
      order: [["createdAt", "DESC"]],
    });

    const saldo = await obtenerSaldoPuntosComercio(comercio_id);

    return res.json({
      ok: true,
      data: {
        comercio_id,
        saldo,
        movimientos,
      },
    });
  } catch (error) {
    console.error("[obtenerPuntosPortalComercio]", error);

    return res.status(500).json({
      ok: false,
      message: "Error al obtener puntos del comercio",
      error: error.message,
    });
  }
};