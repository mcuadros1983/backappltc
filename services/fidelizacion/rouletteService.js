import { Op } from "sequelize";
import {
  PremioCliente,
  ParticipacionCliente,
} from "../../models/fidelizacion/index.js";

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

const contarGanadosPorPremioHoy = async ({ premio_id, transaction }) => {
  return ParticipacionCliente.count({
    where: {
      premio_cliente_id: premio_id,
      resultado: "gano",
      fecha_participacion: {
        [Op.between]: [inicioDelDia(), finDelDia()],
      },
    },
    transaction,
  });
};

const contarGanadosPorPremioTotal = async ({ premio_id, transaction }) => {
  return ParticipacionCliente.count({
    where: {
      premio_cliente_id: premio_id,
      resultado: "gano",
    },
    transaction,
  });
};

const premioDisponible = async ({ premio, transaction }) => {
  if (premio.estado !== "activo") return false;

  if (premio.ilimitado) return true;

  if (premio.stock_total !== null && premio.stock_total !== undefined) {
    const totalGanados = await contarGanadosPorPremioTotal({
      premio_id: premio.id,
      transaction,
    });

    if (totalGanados >= premio.stock_total) return false;
  }

  if (premio.stock_diario !== null && premio.stock_diario !== undefined) {
    const ganadosHoy = await contarGanadosPorPremioHoy({
      premio_id: premio.id,
      transaction,
    });

    if (ganadosHoy >= premio.stock_diario) return false;
  }

  return true;
};

const seleccionarPorProbabilidad = (premios) => {
  const totalProbabilidad = premios.reduce((acc, premio) => {
    return acc + Number(premio.probabilidad || 0);
  }, 0);

  if (totalProbabilidad <= 0) {
    return null;
  }

  const random = Math.random() * totalProbabilidad;

  let acumulado = 0;

  for (const premio of premios) {
    acumulado += Number(premio.probabilidad || 0);

    if (random <= acumulado) {
      return premio;
    }
  }

  return null;
};

export const seleccionarPremioRuleta = async ({ campania_id, transaction }) => {
  const premiosActivos = await PremioCliente.findAll({
    where: {
      campania_id,
      estado: "activo",
    },
    order: [
      ["prioridad", "ASC"],
      ["id", "ASC"],
    ],
    transaction,
  });

  if (!premiosActivos.length) {
    return {
      gano: false,
      premio: null,
      resultado: "siga_participando",
      motivo: "sin_premios_activos",
    };
  }

  const premiosDisponibles = [];

  for (const premio of premiosActivos) {
    const disponible = await premioDisponible({ premio, transaction });

    if (disponible) {
      premiosDisponibles.push(premio);
    }
  }

  if (!premiosDisponibles.length) {
    return {
      gano: false,
      premio: null,
      resultado: "siga_participando",
      motivo: "premios_agotados",
    };
  }

  const premioSeleccionado = seleccionarPorProbabilidad(premiosDisponibles);

  if (!premioSeleccionado) {
    return {
      gano: false,
      premio: null,
      resultado: "siga_participando",
      motivo: "sin_probabilidad",
    };
  }

  if (premioSeleccionado.tipo_premio === "siga_participando") {
    return {
      gano: false,
      premio: premioSeleccionado,
      resultado: "siga_participando",
      motivo: "siga_participando",
    };
  }

  return {
    gano: true,
    premio: premioSeleccionado,
    resultado: "gano",
    motivo: null,
  };
};