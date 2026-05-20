import jwt from "jsonwebtoken";
import { ComercioAsociado } from "../../models/fidelizacion/index.js";

const JWT_SECRET = process.env.JWT_SECRET_TOKEN || process.env.JWT_SECRET || "dev_secret";

const normalizarDocumento = (value = "") => {
  return String(value).replace(/\D/g, "").trim();
};

const normalizarTelefono = (value = "") => {
  return String(value).replace(/\D/g, "").trim();
};

export const validarLoginComercio = async ({ documento_numero, telefono }) => {
  const documentoNormalizado = normalizarDocumento(documento_numero);
  const telefonoNormalizado = normalizarTelefono(telefono);

  if (!documentoNormalizado || !telefonoNormalizado) {
    return {
      ok: false,
      status: 400,
      message: "CUIT/DNI y teléfono son obligatorios",
    };
  }

  const comercio = await ComercioAsociado.findOne({
    where: {
      documento_numero: documentoNormalizado,
    },
  });

  if (!comercio) {
    return {
      ok: false,
      status: 404,
      message: "No se encontró un comercio con ese CUIT/DNI",
    };
  }

  if (!comercio.habilitado || comercio.estado !== "activo") {
    return {
      ok: false,
      status: 403,
      message: "El comercio no está habilitado para acceder al portal",
    };
  }

  const telefonoComercio = normalizarTelefono(comercio.telefono);

  if (telefonoComercio && telefonoComercio !== telefonoNormalizado) {
    return {
      ok: false,
      status: 401,
      message: "El teléfono no coincide con el registrado para el comercio",
    };
  }

  const token = jwt.sign(
    {
      tipo: "comercio_fidelizacion",
      comercio_id: comercio.id,
      documento_numero: comercio.documento_numero,
    },
    JWT_SECRET,
    { expiresIn: "12h" }
  );

  return {
    ok: true,
    comercio,
    token,
  };
};

export const verificarTokenComercio = (token) => {
  return jwt.verify(token, JWT_SECRET);
};