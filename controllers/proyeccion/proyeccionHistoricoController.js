// server/controllers/proyeccion/proyeccionHistoricoController.js
import ProyeccionResultado from "../../models/proyeccion/ProyeccionResultado.js";
import { Op } from "sequelize";

export const proyeccionHistoricoController = {
  async listar(req, res) {
    try {
      const {
        sucursalId,
        fechaDesde,
        fechaHasta,
        lote_calculo_id,
      } = req.query;

      const where = {};

      if (sucursalId) {
        where.sucursal_id = Number(sucursalId);
      }
      if (lote_calculo_id) {
        where.lote_calculo_id = lote_calculo_id;
      }
      if (fechaDesde || fechaHasta) {
        where.fecha = {};
        if (fechaDesde) where.fecha[Op.gte] = fechaDesde;
        if (fechaHasta) where.fecha[Op.lte] = fechaHasta;
      }

      // 1) Traer proyecciones guardadas
      const proys = await ProyeccionResultado.findAll({
        where,
        order: [
          ["fecha", "ASC"],
          ["sucursal_id", "ASC"],
        ],
      });

      if (proys.length === 0) {
        // nada que cruzar
        return res.json([]);
      }

      // 2) Determinar rango mínimo/máximo de fechas y las sucursales involucradas
      //    para pedir las ventas reales sólo de lo necesario
      const fechasTodas = proys.map((p) => p.fecha);
      const fechaMin = fechaDesde || fechasTodas.reduce((a, b) => (a < b ? a : b));
      const fechaMax = fechaHasta || fechasTodas.reduce((a, b) => (a > b ? a : b));
      const sucursalesSet = new Set(
        proys.map((p) => String(p.sucursal_id))
      );

      // 3) Traer ventas reales para cada sucursal de interés en ese rango
      //    Vamos a armar un map acumulado para TODAS las sucursales consultadas
      const ventasMapGlobal = {};

      for (const suc of sucursalesSet) {
        const ventasMap = await obtenerVentasRealesMap({
          fechaDesde: fechaMin,
          fechaHasta: fechaMax,
          sucursalId: Number(suc),
        });
        // merge al global
        Object.keys(ventasMap).forEach((key) => {
          ventasMapGlobal[key] = ventasMap[key];
        });
      }

      // 4) Combinar proyección + venta real + desvío
      const respuesta = proys.map((p) => {
        const key = `${p.fecha}::${p.sucursal_id}`;
        const venta_real = ventasMapGlobal[key] ?? null;

        const proyFinalNum = Number(p.proyeccion_final || 0);
        const ventaRealNum = venta_real == null ? null : Number(venta_real);

        let desvio_pct = null;
        if (ventaRealNum != null && proyFinalNum > 0) {
          // desvío = (real - proyectado)/proyectado * 100
          desvio_pct = ((ventaRealNum - proyFinalNum) / proyFinalNum) * 100;
        }

        return {
          id: p.id,
          fecha: p.fecha,
          sucursal_id: p.sucursal_id,
          proyeccion_base: Number(p.proyeccion_base),
          proyeccion_final: proyFinalNum,
          venta_real: ventaRealNum,
          desvio_pct,
          ajustes_aplicados: p.ajustes_aplicados,
          lote_calculo_id: p.lote_calculo_id,
          createdAt: p.createdAt,
        };
      });

      res.json(respuesta);
    } catch (err) {
      console.error("Error listando histórico proyección:", err);
      res.status(500).json({ error: "Error listando histórico" });
    }
  },
};