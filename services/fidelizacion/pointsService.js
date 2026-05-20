import { PuntoComercioMovimiento } from "../../models/fidelizacion/index.js";

export const acreditarPuntosPorCanje = async ({
  comercio_id,
  cupon_id,
  canje_cupon_id,
  premio,
  usuario_id = null,
  transaction,
}) => {
  const puntos = Number(premio?.puntos_otorga_comercio || 0);

  if (!puntos || puntos <= 0) {
    return null;
  }

  const movimiento = await PuntoComercioMovimiento.create(
    {
      comercio_id,
      cupon_id,
      canje_cupon_id,
      tipo_movimiento: "acreditacion",
      puntos,
      fecha_movimiento: new Date(),
      fecha_vencimiento: null,
      estado: "activo",
      motivo: `Acreditación por canje de cupón ${cupon_id}`,
      created_by: usuario_id,
    },
    { transaction }
  );

  return movimiento;
};

export const obtenerSaldoPuntosComercio = async (comercio_id) => {
  const movimientos = await PuntoComercioMovimiento.findAll({
    where: {
      comercio_id,
      estado: "activo",
    },
  });

  return movimientos.reduce((acc, mov) => {
    return acc + Number(mov.puntos || 0);
  }, 0);
};