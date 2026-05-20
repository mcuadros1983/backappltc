import { Op } from "sequelize";
import {
  AlertaFraude,
  ParticipacionCliente,
} from "../../models/fidelizacion/index.js";

const inicioUltimas24Horas = () => {
  const date = new Date();
  date.setHours(date.getHours() - 24);
  return date;
};

export const crearAlertaFraude = async ({
  participacion_id = null,
  cliente_id = null,
  comercio_id = null,
  tipo_alerta = "otro",
  nivel_riesgo = "bajo",
  descripcion,
  transaction = null,
}) => {
  if (!descripcion) return null;

  return AlertaFraude.create(
    {
      participacion_id,
      cliente_id,
      comercio_id,
      tipo_alerta,
      nivel_riesgo,
      descripcion,
      estado: "pendiente",
    },
    { transaction }
  );
};

export const analizarParticipacionBloqueada = async ({
  participacion,
  transaction = null,
}) => {
  if (!participacion || participacion.estado !== "bloqueada") return null;

  const motivo = participacion.motivo_bloqueo;

  let nivel_riesgo = "bajo";
  let tipo_alerta = "participacion_bloqueada";

  if (motivo === "device_repetido") {
    nivel_riesgo = "medio";
    tipo_alerta = "device_repetido";
  }

  if (motivo === "telefono_repetido") {
    nivel_riesgo = "bajo";
    tipo_alerta = "telefono_repetido";
  }

  if (motivo === "fuera_de_rango") {
    nivel_riesgo = "medio";
    tipo_alerta = "fuera_de_rango";
  }

  if (motivo === "gps_denegado") {
    nivel_riesgo = "bajo";
    tipo_alerta = "gps_invalido";
  }

  if (motivo === "fraude_sospechado") {
    nivel_riesgo = "alto";
    tipo_alerta = "otro";
  }

  return crearAlertaFraude({
    participacion_id: participacion.id,
    cliente_id: participacion.cliente_id,
    comercio_id: participacion.comercio_id,
    tipo_alerta,
    nivel_riesgo,
    descripcion: `Participación bloqueada. Motivo: ${motivo || "sin motivo"}`,
    transaction,
  });
};

export const detectarMultiplesTelefonosMismoDevice = async ({
  device_id,
  comercio_id,
  transaction = null,
}) => {
  if (!device_id) return null;

  const desde = inicioUltimas24Horas();

  const participaciones = await ParticipacionCliente.findAll({
    where: {
      device_id,
      comercio_id,
      fecha_participacion: {
        [Op.gte]: desde,
      },
      telefono_ingresado: {
        [Op.ne]: null,
      },
    },
    attributes: ["telefono_ingresado"],
    transaction,
  });

  const telefonosUnicos = new Set(
    participaciones.map((p) => p.telefono_ingresado).filter(Boolean)
  );

  if (telefonosUnicos.size >= 3) {
    return crearAlertaFraude({
      comercio_id,
      tipo_alerta: "multiples_telefonos_mismo_device",
      nivel_riesgo: "alto",
      descripcion: `El mismo dispositivo participó con ${telefonosUnicos.size} teléfonos distintos en las últimas 24 horas.`,
      transaction,
    });
  }

  return null;
};

export const detectarIntentosRepetidosFueraDeRango = async ({
  comercio_id,
  device_id,
  transaction = null,
}) => {
  if (!comercio_id || !device_id) return null;

  const desde = inicioUltimas24Horas();

  const total = await ParticipacionCliente.count({
    where: {
      comercio_id,
      device_id,
      motivo_bloqueo: "fuera_de_rango",
      fecha_participacion: {
        [Op.gte]: desde,
      },
    },
    transaction,
  });

  if (total >= 3) {
    return crearAlertaFraude({
      comercio_id,
      tipo_alerta: "fuera_de_rango",
      nivel_riesgo: "medio",
      descripcion: `El dispositivo tuvo ${total} intentos fuera de rango en las últimas 24 horas.`,
      transaction,
    });
  }

  return null;
};

export const ejecutarAnalisisBasicoFraude = async ({
  participacion,
  transaction = null,
}) => {
  const alertas = [];

  const alertaBloqueo = await analizarParticipacionBloqueada({
    participacion,
    transaction,
  });

  if (alertaBloqueo) alertas.push(alertaBloqueo);

  const alertaTelefonos = await detectarMultiplesTelefonosMismoDevice({
    device_id: participacion.device_id,
    comercio_id: participacion.comercio_id,
    transaction,
  });

  if (alertaTelefonos) alertas.push(alertaTelefonos);

  const alertaRango = await detectarIntentosRepetidosFueraDeRango({
    comercio_id: participacion.comercio_id,
    device_id: participacion.device_id,
    transaction,
  });

  if (alertaRango) alertas.push(alertaRango);

  return alertas;
};