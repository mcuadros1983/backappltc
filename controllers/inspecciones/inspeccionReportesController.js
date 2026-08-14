import { Op, fn, col, literal } from "sequelize";

import {
  Inspeccion,
  InspeccionRespuesta,
  InspeccionEvidencia,
  Sucursal,
} from "../../models/index.js";

const esAdminInspecciones = (req) => {
  const permissions = req.user?.permissions || [];

  return (
    Number(req.user?.rol_id) === 1 ||
    permissions.includes("admin.all") ||
    permissions.includes("inspecciones:admin") ||
    permissions.includes("inspecciones:reportes")
  );
};

const aplicarFiltroSucursal = (req, where = {}) => {
  if (esAdminInspecciones(req)) {
    return where;
  }

  return {
    ...where,
    sucursal_id: req.user.sucursal_id,
  };
};

const hoyDateOnly = () => {
  return new Date().toISOString().slice(0, 10);
};

// GET /inspecciones/dashboard
export const obtenerDashboardInspecciones = async (req, res) => {
  try {
    const whereInspeccion = aplicarFiltroSucursal(req);

    const inspeccionesAbiertas = await Inspeccion.count({
      where: {
        ...whereInspeccion,
        estado: "ABIERTA",
      },
    });

    const inspeccionesParciales = await Inspeccion.count({
      where: {
        ...whereInspeccion,
        estado: "PARCIAL",
      },
    });

    const inspeccionesCerradas = await Inspeccion.count({
      where: {
        ...whereInspeccion,
        estado: "CERRADA",
      },
    });

    const inspecciones = await Inspeccion.findAll({
      where: {
        ...whereInspeccion,
        estado: {
          [Op.ne]:
            "ANULADA",
        },
      },

      attributes: ["id"],
      raw: true,

    });

    const inspeccionIds = inspecciones.map((i) => i.id);

    if (inspeccionIds.length === 0) {
      return res.json({
        inspecciones: {
          abiertas: 0,
          parciales: 0,
          cerradas: 0,
          total: 0,
        },
        respuestas: {
          pendientes: 0,
          enTrabajo: 0,
          enRevision: 0,
          aprobadas: 0,
          rechazadas: 0,
          reabiertas: 0,
          cerradas: 0,
          vencidas: 0,
          criticasAbiertas: 0,
        },
        evidencias: {
          total: 0,
        },
      });
    }

    const [
      pendientes,
      enTrabajo,
      enRevision,
      aprobadas,
      rechazadas,
      reabiertas,
      respuestasCerradas,
      vencidas,
      criticasAbiertas,
      totalEvidencias,
    ] = await Promise.all([
      InspeccionRespuesta.count({
        where: {
          inspeccion_id: { [Op.in]: inspeccionIds },
          estado: "PENDIENTE",
        },
      }),

      InspeccionRespuesta.count({
        where: {
          inspeccion_id: { [Op.in]: inspeccionIds },
          estado: "EN_TRABAJO",
        },
      }),

      InspeccionRespuesta.count({
        where: {
          inspeccion_id: { [Op.in]: inspeccionIds },
          estado: "EN_REVISION",
        },
      }),

      InspeccionRespuesta.count({
        where: {
          inspeccion_id: { [Op.in]: inspeccionIds },
          estado: "APROBADA",
        },
      }),

      InspeccionRespuesta.count({
        where: {
          inspeccion_id: { [Op.in]: inspeccionIds },
          estado: "RECHAZADA",
        },
      }),

      InspeccionRespuesta.count({
        where: {
          inspeccion_id: { [Op.in]: inspeccionIds },
          estado: "REABIERTA",
        },
      }),

      InspeccionRespuesta.count({
        where: {
          inspeccion_id: { [Op.in]: inspeccionIds },
          estado: "CERRADA",
        },
      }),

      InspeccionRespuesta.count({
        where: {
          inspeccion_id: { [Op.in]: inspeccionIds },
          estado: {
            [Op.in]: [
              "PENDIENTE",
              "EN_TRABAJO",
              "RECHAZADA",
              "REABIERTA",
            ],
          },
          fecha_limite: {
            [Op.lt]: hoyDateOnly(),
          },
        },
      }),

      InspeccionRespuesta.count({
        where: {
          inspeccion_id: { [Op.in]: inspeccionIds },
          criticidad_observacion: "CRITICA",
          estado: {
            [Op.notIn]: ["APROBADA", "CERRADA"],
          },
        },
      }),

      InspeccionEvidencia.count({
        include: [
          {
            model: InspeccionRespuesta,
            as: "respuesta",
            required: true,
            where: {
              inspeccion_id: { [Op.in]: inspeccionIds },
            },
          },
        ],
      }),
    ]);

    return res.json({
      inspecciones: {
        abiertas: inspeccionesAbiertas,
        parciales: inspeccionesParciales,
        cerradas: inspeccionesCerradas,
        total:
          inspeccionesAbiertas +
          inspeccionesParciales +
          inspeccionesCerradas,
      },
      respuestas: {
        pendientes,
        enTrabajo,
        enRevision,
        aprobadas,
        rechazadas,
        reabiertas,
        cerradas: respuestasCerradas,
        vencidas,
        criticasAbiertas,
      },
      evidencias: {
        total: totalEvidencias,
      },
    });
  } catch (error) {
    console.error("Error obtenerDashboardInspecciones:", error);
    return res.status(500).json({
      message: "Error obteniendo dashboard de inspecciones",
      error: error.message,
    });
  }
};

// GET /inspecciones/ranking
export const obtenerRankingSucursales = async (req, res) => {
  try {
    const whereInspeccion = aplicarFiltroSucursal(req);

    const inspecciones = await Inspeccion.findAll({
          where: {
      ...whereInspeccion,
      estado: {
        [Op.ne]:
          "ANULADA",
      },
    },
      attributes: ["id", "sucursal_id"],
      include: [
        {
          model: Sucursal,
          as: "sucursal",
          attributes: ["id", "nombre"],
        },
      ],
    });

    const resultado = [];

    for (const inspeccion of inspecciones) {
      const respuestas = await InspeccionRespuesta.findAll({
        where: {
          inspeccion_id: inspeccion.id,
          resultado: {
            [Op.in]: ["CUMPLE", "NO_CUMPLE"],
          },
        },
        attributes: ["resultado", "peso_item"],
      });

      const pesoTotal = respuestas.reduce(
        (acc, r) => acc + Number(r.peso_item || 1),
        0
      );

      const pesoCumple = respuestas
        .filter((r) => r.resultado === "CUMPLE")
        .reduce((acc, r) => acc + Number(r.peso_item || 1), 0);

      const cumplimiento =
        pesoTotal > 0 ? Number(((pesoCumple / pesoTotal) * 100).toFixed(2)) : 0;

      const existente = resultado.find(
        (r) => Number(r.sucursal_id) === Number(inspeccion.sucursal_id)
      );

      if (existente) {
        existente.cantidad_inspecciones += 1;
        existente.suma_cumplimiento += cumplimiento;
        existente.cumplimiento = Number(
          (
            existente.suma_cumplimiento / existente.cantidad_inspecciones
          ).toFixed(2)
        );
      } else {
        resultado.push({
          sucursal_id: inspeccion.sucursal_id,
          sucursal: inspeccion.sucursal?.nombre || `Sucursal ${inspeccion.sucursal_id}`,
          cantidad_inspecciones: 1,
          suma_cumplimiento: cumplimiento,
          cumplimiento,
        });
      }
    }

    resultado.sort((a, b) => b.cumplimiento - a.cumplimiento);

    return res.json(
      resultado.map(({ suma_cumplimiento, ...item }) => item)
    );
  } catch (error) {
    console.error("Error obtenerRankingSucursales:", error);
    return res.status(500).json({
      message: "Error obteniendo ranking de sucursales",
      error: error.message,
    });
  }
};

// GET /inspecciones/top-problemas
export const obtenerTopProblemas = async (req, res) => {
  try {
    const whereInspeccion = aplicarFiltroSucursal(req);

    const inspecciones = await Inspeccion.findAll({
          where: {
      ...whereInspeccion,
      estado: {
        [Op.ne]:
          "ANULADA",
      },
    },
      attributes: ["id"],
      raw: true,
    });

    const inspeccionIds = inspecciones.map((i) => i.id);

    if (inspeccionIds.length === 0) {
      return res.json([]);
    }

    const topProblemas = await InspeccionRespuesta.findAll({
      where: {
        inspeccion_id: { [Op.in]: inspeccionIds },
        resultado: "NO_CUMPLE",
      },
      attributes: [
        "descripcion_item",
        "categoria_nombre",
        [fn("COUNT", col("id")), "cantidad"],
      ],
      group: ["descripcion_item", "categoria_nombre"],
      order: [[literal("cantidad"), "DESC"]],
      limit: 20,
      raw: true,
    });

    return res.json(topProblemas);
  } catch (error) {
    console.error("Error obtenerTopProblemas:", error);
    return res.status(500).json({
      message: "Error obteniendo top de problemas",
      error: error.message,
    });
  }
};

// GET /inspecciones/vencidas
export const obtenerObservacionesVencidas = async (req, res) => {
  try {
    const whereInspeccion = aplicarFiltroSucursal(req);

    const inspecciones = await Inspeccion.findAll({
          where: {
      ...whereInspeccion,
      estado: {
        [Op.ne]:
          "ANULADA",
      },
    },
      attributes: ["id"],
      raw: true,
    });

    const inspeccionIds = inspecciones.map((i) => i.id);

    if (inspeccionIds.length === 0) {
      return res.json([]);
    }

    const vencidas = await InspeccionRespuesta.findAll({
      where: {
        inspeccion_id: { [Op.in]: inspeccionIds },
        estado: {
          [Op.in]: [
            "PENDIENTE",
            "EN_TRABAJO",
            "RECHAZADA",
            "REABIERTA",
          ],
        },
        fecha_limite: {
          [Op.lt]: hoyDateOnly(),
        },
      },
      include: [
        {
          model: Inspeccion,
          as: "inspeccion",
          include: [
            {
              model: Sucursal,
              as: "sucursal",
              attributes: ["id", "nombre"],
            },
          ],
        },
      ],
      order: [["fecha_limite", "ASC"]],
    });

    return res.json(vencidas);
  } catch (error) {
    console.error("Error obtenerObservacionesVencidas:", error);
    return res.status(500).json({
      message: "Error obteniendo observaciones vencidas",
      error: error.message,
    });
  }
};

// GET /inspecciones/reincidencias
export const obtenerReincidencias = async (req, res) => {
  try {
    const whereInspeccion = aplicarFiltroSucursal(req);

    const inspecciones = await Inspeccion.findAll({
          where: {
      ...whereInspeccion,
      estado: {
        [Op.ne]:
          "ANULADA",
      },
    },
      attributes: ["id", "sucursal_id"],
      include: [
        {
          model: Sucursal,
          as: "sucursal",
          attributes: ["id", "nombre"],
        },
      ],
    });

    const inspeccionIds = inspecciones.map((i) => i.id);

    if (inspeccionIds.length === 0) {
      return res.json([]);
    }

    const respuestas = await InspeccionRespuesta.findAll({
      where: {
        inspeccion_id: { [Op.in]: inspeccionIds },
        resultado: "NO_CUMPLE",
      },
      include: [
        {
          model: Inspeccion,
          as: "inspeccion",
          include: [
            {
              model: Sucursal,
              as: "sucursal",
              attributes: ["id", "nombre"],
            },
          ],
        },
      ],
    });

    const mapa = new Map();

    for (const respuesta of respuestas) {
      const sucursalId = respuesta.inspeccion?.sucursal_id;
      const sucursalNombre =
        respuesta.inspeccion?.sucursal?.nombre || `Sucursal ${sucursalId}`;
      const key = `${sucursalId}_${respuesta.descripcion_item}`;

      if (!mapa.has(key)) {
        mapa.set(key, {
          sucursal_id: sucursalId,
          sucursal: sucursalNombre,
          item: respuesta.descripcion_item,
          categoria: respuesta.categoria_nombre,
          cantidad: 0,
        });
      }

      mapa.get(key).cantidad += 1;
    }

    const reincidencias = Array.from(mapa.values())
      .filter((item) => item.cantidad >= 2)
      .sort((a, b) => b.cantidad - a.cantidad);

    return res.json(reincidencias);
  } catch (error) {
    console.error("Error obtenerReincidencias:", error);
    return res.status(500).json({
      message: "Error obteniendo reincidencias",
      error: error.message,
    });
  }
};

// GET /inspecciones/resumen-categorias
export const obtenerResumenCategorias = async (req, res) => {
  try {
    const whereInspeccion = aplicarFiltroSucursal(req);

    const inspecciones = await Inspeccion.findAll({
          where: {
      ...whereInspeccion,
      estado: {
        [Op.ne]:
          "ANULADA",
      },
    },
      attributes: ["id"],
      raw: true,
    });

    const inspeccionIds = inspecciones.map((i) => i.id);

    if (inspeccionIds.length === 0) {
      return res.json([]);
    }

    const resumen = await InspeccionRespuesta.findAll({
      where: {
        inspeccion_id: { [Op.in]: inspeccionIds },
      },
      attributes: [
        "categoria_nombre",
        [fn("COUNT", col("id")), "total"],
        [
          fn(
            "SUM",
            literal(`CASE WHEN resultado = 'CUMPLE' THEN 1 ELSE 0 END`)
          ),
          "cumple",
        ],
        [
          fn(
            "SUM",
            literal(`CASE WHEN resultado = 'NO_CUMPLE' THEN 1 ELSE 0 END`)
          ),
          "no_cumple",
        ],
        [
          fn(
            "SUM",
            literal(`CASE WHEN resultado = 'NO_APLICA' THEN 1 ELSE 0 END`)
          ),
          "no_aplica",
        ],
      ],
      group: ["categoria_nombre"],
      order: [["categoria_nombre", "ASC"]],
      raw: true,
    });

    return res.json(resumen);
  } catch (error) {
    console.error("Error obtenerResumenCategorias:", error);
    return res.status(500).json({
      message: "Error obteniendo resumen por categorías",
      error: error.message,
    });
  }
};