const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

export const calcularDistanciaMetros = ({ lat1, lon1, lat2, lon2 }) => {
  const R = 6371000;

  const lat1Rad = (lat1 * Math.PI) / 180;
  const lat2Rad = (lat2 * Math.PI) / 180;
  const deltaLat = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1Rad) *
      Math.cos(lat2Rad) *
      Math.sin(deltaLon / 2) *
      Math.sin(deltaLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

export const validarUbicacionCliente = ({
  comercio,
  lat_cliente,
  lon_cliente,
  precision_gps,
}) => {
  const latComercio = toNumber(comercio?.lat);
  const lonComercio = toNumber(comercio?.lon);
  const radioMetros = toNumber(comercio?.radio_metros) || 80;

  const latCliente = toNumber(lat_cliente);
  const lonCliente = toNumber(lon_cliente);
  const precision = toNumber(precision_gps);

  if (latCliente === null || lonCliente === null) {
    return {
      ok: false,
      motivo: "gps_denegado",
      distancia_metros: null,
      message: "No pudimos obtener tu ubicación.",
    };
  }

  if (latComercio === null || lonComercio === null) {
    return {
      ok: false,
      motivo: "error_interno",
      distancia_metros: null,
      message: "El comercio no tiene ubicación configurada.",
    };
  }

  const precisionMaximaPermitida = Math.max(150, radioMetros);

  if (precision !== null && precision > precisionMaximaPermitida) {
    return {
      ok: false,
      motivo: "gps_denegado",
      distancia_metros: null,
      message: `La precisión de tu ubicación no es suficiente. Precisión aproximada: ${Math.round(
        precision
      )} m. Máximo permitido: ${precisionMaximaPermitida} m.`,
    };
  }

  const distancia = calcularDistanciaMetros({
    lat1: latComercio,
    lon1: lonComercio,
    lat2: latCliente,
    lon2: lonCliente,
  });

  if (distancia > radioMetros) {
    return {
      ok: false,
      motivo: "fuera_de_rango",
      distancia_metros: distancia,
      message: `Debés estar dentro del comercio para participar. Distancia aproximada: ${Math.round(
        distancia
      )} m. Radio permitido: ${radioMetros} m.`,
    };
  }

  return {
    ok: true,
    motivo: null,
    distancia_metros: distancia,
    message: "Ubicación válida.",
  };
};