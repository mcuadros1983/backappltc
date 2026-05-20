import crypto from "crypto";
import { ComercioQr } from "../../models/fidelizacion/index.js";

// const getPublicBaseUrl = () => {
//   return process.env.FRONTEND_PUBLIC_URL || "http://localhost:3000";
// };

const getPublicBaseUrl = () => {
  return (
    process.env.PUBLIC_FIDELIZACION_URL ||
    process.env.FRONTEND_PUBLIC_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
};

export const generarQrParaComercio = async (comercio_id, transaction = null) => {
  const token = crypto.randomBytes(32).toString("hex");

  const url = `${getPublicBaseUrl()}/qr/${token}`;

  await ComercioQr.update(
    {
      estado: "revocado",
      fecha_baja: new Date(),
    },
    {
      where: {
        comercio_id,
        estado: "activo",
      },
      transaction,
    }
  );

  const nuevoQr = await ComercioQr.create(
    {
      comercio_id,
      token,
      url,
      estado: "activo",
      fecha_generacion: new Date(),
    },
    { transaction }
  );

  return nuevoQr;
};

export const obtenerQrActivoPorComercio = async (comercio_id) => {
  return ComercioQr.findOne({
    where: {
      comercio_id,
      estado: "activo",
    },
  });
};