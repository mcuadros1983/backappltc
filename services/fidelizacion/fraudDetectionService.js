import { Op } from "sequelize";
import { ParticipacionCliente } from "../../models/fidelizacion/index.js";

const inicioDelDia = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};

const finDelDia = () => {
  const date = new Date();
  date.setHours(23, 59, 59, 999);
  return date;
};

export const validarParticipacionDiaria = async ({
  comercio,
  telefono_normalizado,
  device_id,
}) => {
  if (comercio?.permite_multiples_participaciones) {
    return {
      ok: true,
      motivo: null,
      message: "El comercio permite múltiples participaciones.",
    };
  }

  const desde = inicioDelDia();
  const hasta = finDelDia();

  if (telefono_normalizado) {
    const participacionPorTelefono = await ParticipacionCliente.findOne({
      where: {
        comercio_id: comercio.id,
        telefono_ingresado: telefono_normalizado,
        fecha_participacion: {
          [Op.between]: [desde, hasta],
        },
        resultado: {
          [Op.ne]: "error",
        },
      },
    });

    if (participacionPorTelefono) {
      return {
        ok: false,
        motivo: "telefono_repetido",
        message: "Ya participaste hoy con este teléfono.",
      };
    }
  }

  if (device_id) {
    const participacionPorDevice = await ParticipacionCliente.findOne({
      where: {
        comercio_id: comercio.id,
        device_id,
        fecha_participacion: {
          [Op.between]: [desde, hasta],
        },
        resultado: {
          [Op.ne]: "error",
        },
      },
    });

    if (participacionPorDevice) {
      return {
        ok: false,
        motivo: "device_repetido",
        message: "Ya participaste hoy desde este dispositivo.",
      };
    }
  }

  return {
    ok: true,
    motivo: null,
    message: "Participación permitida.",
  };
};

export const normalizarTelefono = (telefono = "") => {
  return String(telefono).replace(/\D/g, "").trim();
};