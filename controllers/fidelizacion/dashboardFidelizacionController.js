import { Op, fn, col, literal } from "sequelize";
import {
  ComercioAsociado,
  ParticipacionCliente,
  CuponCliente,
  CanjeCuponCliente,
  PuntoComercioMovimiento,
  PremioCliente,
} from "../../models/fidelizacion/index.js";

const getDateRange = (desde, hasta) => {
  const fechaDesde = desde ? new Date(desde) : new Date();
  const fechaHasta = hasta ? new Date(hasta) : new Date();

  if (!desde) fechaDesde.setHours(0, 0, 0, 0);
  if (!hasta) fechaHasta.setHours(23, 59, 59, 999);

  return { fechaDesde, fechaHasta };
};

export const obtenerDashboardFidelizacion = async (req, res) => {
  try {
    const { desde, hasta } = req.query;
    const { fechaDesde, fechaHasta } = getDateRange(desde, hasta);

    const dateWhere = {
      [Op.between]: [fechaDesde, fechaHasta],
    };

    const [
      totalComercios,
      comerciosActivos,
      totalParticipaciones,
      participacionesGanadas,
      participacionesSiga,
      participacionesBloqueadas,
      totalCupones,
      cuponesDisponibles,
      cuponesUsados,
      cuponesVencidos,
      totalCanjes,
      movimientosPuntos,
      rankingComercios,
      rankingPremios,
    ] = await Promise.all([
      ComercioAsociado.count(),

      ComercioAsociado.count({
        where: {
          estado: "activo",
          habilitado: true,
        },
      }),

      ParticipacionCliente.count({
        where: {
          fecha_participacion: dateWhere,
        },
      }),

      ParticipacionCliente.count({
        where: {
          fecha_participacion: dateWhere,
          resultado: "gano",
        },
      }),

      ParticipacionCliente.count({
        where: {
          fecha_participacion: dateWhere,
          resultado: "siga_participando",
        },
      }),

      ParticipacionCliente.count({
        where: {
          fecha_participacion: dateWhere,
          resultado: "bloqueado",
        },
      }),

      CuponCliente.count({
        where: {
          fecha_emision: dateWhere,
        },
      }),

      CuponCliente.count({
        where: {
          fecha_emision: dateWhere,
          estado: "disponible",
        },
      }),

      CuponCliente.count({
        where: {
          fecha_emision: dateWhere,
          estado: "usado",
        },
      }),

      CuponCliente.count({
        where: {
          fecha_emision: dateWhere,
          estado: "vencido",
        },
      }),

      CanjeCuponCliente.count({
        where: {
          fecha_canje: dateWhere,
          estado: "confirmado",
        },
      }),

      PuntoComercioMovimiento.findAll({
        where: {
          fecha_movimiento: dateWhere,
          estado: "activo",
        },
        attributes: [
          [fn("SUM", col("puntos")), "total_puntos"],
          [fn("COUNT", col("id")), "total_movimientos"],
        ],
        raw: true,
      }),

      ParticipacionCliente.findAll({
        where: {
          fecha_participacion: dateWhere,
        },
        attributes: [
          "comercio_id",
          [fn("COUNT", col("ParticipacionCliente.id")), "participaciones"],
          [
            fn(
              "SUM",
              literal(
                `CASE WHEN "ParticipacionCliente"."resultado" = 'gano' THEN 1 ELSE 0 END`
              )
            ),
            "ganadores",
          ],
        ],
        include: [
          {
            model: ComercioAsociado,
            as: "comercio",
            attributes: ["id", "nombre_fantasia", "domicilio"],
            required: false,
          },
        ],
        group: ["comercio_id", "comercio.id"],
        order: [[literal("participaciones"), "DESC"]],
        limit: 10,
      }),

      ParticipacionCliente.findAll({
        where: {
          fecha_participacion: dateWhere,
          premio_cliente_id: {
            [Op.ne]: null,
          },
        },
        attributes: [
          "premio_cliente_id",
          [fn("COUNT", col("ParticipacionCliente.id")), "total"],
        ],
        include: [
          {
            model: PremioCliente,
            as: "premio",
            attributes: ["id", "nombre", "tipo_premio"],
            required: false,
          },
        ],
        group: ["premio_cliente_id", "premio.id"],
        order: [[literal("total"), "DESC"]],
        limit: 10,
      }),
    ]);

    const totalPuntos = Number(movimientosPuntos?.[0]?.total_puntos || 0);
    const totalMovimientosPuntos = Number(
      movimientosPuntos?.[0]?.total_movimientos || 0
    );

    const tasaGanadores =
      totalParticipaciones > 0
        ? (participacionesGanadas / totalParticipaciones) * 100
        : 0;

    const tasaCanje =
      totalCupones > 0 ? (totalCanjes / totalCupones) * 100 : 0;

    return res.json({
      ok: true,
      data: {
        filtros: {
          desde: fechaDesde,
          hasta: fechaHasta,
        },
        resumen: {
          totalComercios,
          comerciosActivos,
          totalParticipaciones,
          participacionesGanadas,
          participacionesSiga,
          participacionesBloqueadas,
          totalCupones,
          cuponesDisponibles,
          cuponesUsados,
          cuponesVencidos,
          totalCanjes,
          totalPuntos,
          totalMovimientosPuntos,
          tasaGanadores: Number(tasaGanadores.toFixed(2)),
          tasaCanje: Number(tasaCanje.toFixed(2)),
        },
        rankingComercios,
        rankingPremios,
      },
    });
  } catch (error) {
    console.error("[obtenerDashboardFidelizacion]", error);

    return res.status(500).json({
      ok: false,
      message: "Error al obtener dashboard de fidelización",
      error: error.message,
    });
  }
};