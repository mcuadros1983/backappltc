import crypto from "crypto";
import { QueryTypes } from "sequelize";
import { sequelize } from "../../config/database.js";
import { CuponCliente } from "../../models/fidelizacion/index.js";

const COUPON_SEQUENCE_NAME = "cupon_cliente_numero_seq";

// const getPublicBaseUrl = () => {
//   return (process.env.FRONTEND_PUBLIC_URL || "http://localhost:3000").replace(
//     /\/$/,
//     ""
//   );
// };

const getPublicBaseUrl = () => {
  return (
    process.env.PUBLIC_FIDELIZACION_URL ||
    process.env.FRONTEND_PUBLIC_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
};

const generarTokenSeguro = () => {
  return crypto.randomBytes(32).toString("hex");
};

const generarCodigoValidacion = () => {
  return crypto.randomBytes(6).toString("hex").toUpperCase();
};

const pad = (num, size = 8) => {
  return String(num).padStart(size, "0");
};

const ensureCouponSequence = async ({ transaction } = {}) => {
  await sequelize.query(
    `CREATE SEQUENCE IF NOT EXISTS ${COUPON_SEQUENCE_NAME} START 1 INCREMENT 1;`,
    { transaction }
  );
};

export const generarNumeroCupon = async ({ transaction } = {}) => {
  await ensureCouponSequence({ transaction });

  const year = new Date().getFullYear();

  const [result] = await sequelize.query(
    `SELECT nextval('${COUPON_SEQUENCE_NAME}') AS next_value;`,
    {
      type: QueryTypes.SELECT,
      transaction,
    }
  );

  return `LT-${year}-${pad(result.next_value)}`;
};

export const calcularVencimientoCupon = (premio) => {
  if (!premio?.vence_cupon) return null;

  const dias = Number(premio.dias_vencimiento_cupon || 7);

  const fecha = new Date();
  fecha.setDate(fecha.getDate() + dias);

  return fecha;
};

export const crearCuponParaPremio = async ({
  cliente_id,
  participacion_id,
  comercio_id,
  campania_id,
  premio,
  transaction,
}) => {
  if (!cliente_id || !participacion_id || !comercio_id || !campania_id || !premio?.id) {
    throw new Error("Faltan datos obligatorios para generar el cupón");
  }

  const token = generarTokenSeguro();
  const numero_cupon = await generarNumeroCupon({ transaction });
  const codigo_validacion = generarCodigoValidacion();
  const fecha_vencimiento = calcularVencimientoCupon(premio);
  const qr_url = `${getPublicBaseUrl()}/cupon/${token}`;

  const cupon = await CuponCliente.create(
    {
      numero_cupon,
      token,
      cliente_id,
      participacion_id,
      comercio_id,
      campania_id,
      premio_cliente_id: premio.id,
      estado: "disponible",
      fecha_emision: new Date(),
      fecha_vencimiento,
      qr_url,
      codigo_validacion,
    },
    { transaction }
  );

  return cupon;
};