import { Op } from "sequelize";
import ProyeccionResultado from "../../models/proyeccion/ProyeccionResultado.js";
import { obtenerVentasRealesMap } from "./helpers/ventasRealHelper.js";

export const proyeccionResumenController = {
  async resumen(req, res) {
    try {
      // Query params esperados:
      // ?fechaDesde=2025-11-01&fechaHasta=2025-11-07
      const { fechaDesde, fechaHasta } = req.query;

      if (!fechaDesde || !fechaHasta) {
        return res.status(400).json({
          error: "Debe enviar fechaDesde y fechaHasta (YYYY-MM-DD)",
        });
      }

      // 1) Traer proyecciones guardadas en ese rango (todas las sucursales)
      const proys = await ProyeccionResultado.findAll({
        where: {
          fecha: {
            [Op.between]: [fechaDesde, fechaHasta],
          },
        },
        order: [
          ["sucursal_id", "ASC"],
          ["fecha", "ASC"],
        ],
      });

      if (proys.length === 0) {
        return res.json([]);
      }

      // 2) Necesitamos ventas reales para todas las sucursales involucradas
      const sucursalesSet = new Set(proys.map((p) => String(p.sucursal_id)));

      // Map global fecha::sucursal -> venta_real
      const ventasMapGlobal = {};
      for (const suc of sucursalesSet) {
        const ventasMap = await obtenerVentasRealesMap({
          fechaDesde,
          fechaHasta,
          sucursalId: Number(suc),
        });
        Object.keys(ventasMap).forEach((key) => {
          ventasMapGlobal[key] = ventasMap[key];
        });
      }

      // 3) Agrupar métricas por sucursal
      // estructura:
      // porSucursal[sucursal_id] = {
      //   sucursal_id,
      //   sucursal_nombre,
      //   dias_con_dato,
      //   proyeccion_total,
      //   venta_real_total,
      //   desvio_sum,
      // }
      const porSucursal = {};

      for (const p of proys) {
        const key = `${p.fecha}::${p.sucursal_id}`;
        const ventaReal = ventasMapGlobal[key] ?? null;

        const proyFinalNum = Number(p.proyeccion_final || 0);
        const ventaRealNum = ventaReal == null ? null : Number(ventaReal);

        // calcular desvío % solo si tenemos venta real y proyección > 0
        let desvio_pct_dia = null;
        if (ventaRealNum != null && proyFinalNum > 0) {
          desvio_pct_dia =
            ((ventaRealNum - proyFinalNum) / proyFinalNum) * 100;
        }

        if (!porSucursal[p.sucursal_id]) {
          porSucursal[p.sucursal_id] = {
            sucursal_id: p.sucursal_id,
            sucursal_nombre: p.sucursal_nombre || `Sucursal ${p.sucursal_id}`,
            dias_con_dato: 0,
            proyeccion_total: 0,
            venta_real_total: 0,
            desvio_sum: 0,
            desvio_count: 0,
          };
        }

        const agg = porSucursal[p.sucursal_id];

        // sumas de montos
        agg.proyeccion_total += proyFinalNum;
        if (ventaRealNum != null) {
          agg.venta_real_total += ventaRealNum;
        }

        // promedio del desvío: acumulamos y después promediamos
        if (desvio_pct_dia != null) {
          agg.desvio_sum += desvio_pct_dia;
          agg.desvio_count += 1;
        }

        agg.dias_con_dato += 1;
      }

      // 4) Convertir en array y calcular promedio final de desvío
      const resumenArray = Object.values(porSucursal).map((suc) => {
        let desvio_promedio_pct = null;
        if (suc.desvio_count > 0) {
          desvio_promedio_pct = suc.desvio_sum / suc.desvio_count;
        }

        return {
          sucursal_id: suc.sucursal_id,
          sucursal_nombre: suc.sucursal_nombre,
          dias_con_dato: suc.dias_con_dato,
          proyeccion_total: Number(suc.proyeccion_total.toFixed(2)),
          venta_real_total: Number(suc.venta_real_total.toFixed(2)),
          desvio_promedio_pct:
            desvio_promedio_pct == null
              ? null
              : Number(desvio_promedio_pct.toFixed(2)),
        };
      });

      // 5) Orden útil: la de peor desvío primero (en valor absoluto)
      resumenArray.sort((a, b) => {
        const av = a.desvio_promedio_pct == null ? 0 : Math.abs(a.desvio_promedio_pct);
        const bv = b.desvio_promedio_pct == null ? 0 : Math.abs(b.desvio_promedio_pct);
        return bv - av;
      });

      return res.json(resumenArray);
    } catch (err) {
      console.error("Error en resumen proyección:", err);
      return res.status(500).json({ error: "Error generando resumen" });
    }
  },
};
