// controllers/tesoreria/disponiblesController.js
import { Op } from "sequelize";
import MovimientoCajaTesoreria from "../../models/tesoreria/movimientocajatesoreria.js";
import MovimientoBancoTesoreria from "../../models/tesoreria/movimientobancotesoreria.js";
import EcheqEmitido from "../../models/tesoreria/pagoecheq.js";
import PagoTarjetaCredito from "../../models/tesoreria/pagotarjetacredito.js";
import MovimientoCtaCteProveedor from "../../models/tesoreria/movimientoctacteproveedor.js";

function parseDateRange({ desde, hasta }) {
  const where = {};
  if (desde) where[Op.gte] = desde;
  if (hasta) where[Op.lte] = hasta;
  return Object.keys(where).length ? where : null;
}

export async function listarDisponibles(req, res) {
  try {
    const {
      medio,               // caja | transferencia | echeq | tarjeta | ctacte
      proveedor_id,
      desde,
      hasta,
      q,
    } = req.query || {};

    if (!medio) return res.status(400).json({ error: "medio requerido" });

    const like = q ? { [Op.iLike]: `%${q}%` } : null;

    // Por convención, "disponible" = comprobanteegreso_id NULL
    const baseCommon = { comprobanteegreso_id: null };
    if (proveedor_id) baseCommon.proveedor_id = proveedor_id;

    console.log("basecommon", baseCommon)

    let rows = [];

    switch (String(medio).toLowerCase()) {
      case "caja": { // MovimientoCajaTesoreria
        const where = { ...baseCommon, tipo: "egreso" };


        rows = await MovimientoCajaTesoreria.findAll({
          where,
          order: [["fecha", "DESC"], ["id", "DESC"]],
        });

        console.log("caja", rows)

        // shape homogéneo
        rows = rows.map(r => ({
          tipo: "caja",
          id: r.id,
          fecha: r.fecha,
          monto: Number(r.monto || 0),
          descripcion: r.descripcion || null,
          caja_id: r.caja_id || null,
          proveedor_id: r.proveedor_id || null,
          empresa_id: r.empresa_id || null,
        }));
        break;
      }

      case "transferencia": { // MovimientoBancoTesoreria
        const where = { ...baseCommon, tipo: "egreso" };
        if (desde || hasta) where.fecha = parseDateRange({ desde, hasta });
        if (like) where.descripcion = like;

        rows = await MovimientoBancoTesoreria.findAll({
          where,
          order: [["fecha", "DESC"], ["id", "DESC"]],
        });

        rows = rows.map(r => ({
          tipo: "banco",
          id: r.id,
          fecha: r.fecha,
          monto: Number(r.monto || 0),
          descripcion: r.descripcion || null,
          banco_id: r.banco_id || null,
          referencia: r.referencia || null,
          proveedor_id: r.proveedor_id || null,
          empresa_id: r.empresa_id || null,
        }));
        break;
      }

      case "echeq": { // EcheqEmitido
        const where = { ...baseCommon };
        // por defecto filtramos por fecha_emision; si querés, duplicar lógica para fecha_vencimiento
        if (desde || hasta) where.fecha_emision = parseDateRange({ desde, hasta });
        if (like) where.numero_echeq = like; // o descripcion si existiera

        rows = await EcheqEmitido.findAll({
          where,
          order: [["fecha_emision", "DESC"], ["id", "DESC"]],
        });

        rows = rows.map(r => ({
          tipo: "echeq",
          id: r.id,
          fecha_emision: r.fecha_emision,
          fecha_vencimiento: r.fecha_vencimiento,
          monto: Number(r.importe || 0),
          banco_id: r.banco_id || null,
          numero_echeq: r.numero_echeq || null,
          estado: r.estado || null,
          proveedor_id: r.proveedor_id || null,
          empresa_id: r.empresa_id || null,
        }));
        break;
      }

      case "tarjeta": { // PagoTarjetaCredito
        const where = { ...baseCommon };
        if (desde || hasta) where.fecha = parseDateRange({ desde, hasta });
        if (like) where.concepto = like;

        rows = await PagoTarjetaCredito.findAll({
          where,
          order: [["fecha", "DESC"], ["id", "DESC"]],
        });

        rows = rows.map(r => ({
          tipo: "tarjeta",
          id: r.id,
          fecha: r.fecha,
          monto: Number(r.importe || 0),
          tipotarjeta_id: r.tipotarjeta_id || null,
          marcatarjeta_id: r.marcatarjeta_id || null,
          cupon_numero: r.cupon_numero || null,
          planpago_id: r.planpago_id || null,
          estado: r.estado || null,
          proveedor_id: r.proveedor_id || null,
          empresa_id: r.empresa_id || null,
        }));
        break;
      }

      case "ctacte": { // MovimientoCtaCteProveedor (cargos)
        const where = { ...baseCommon, tipo: "cargo" };
        if (desde || hasta) where.fecha = parseDateRange({ desde, hasta });
        if (like) where.descripcion = like;

        rows = await MovimientoCtaCteProveedor.findAll({
          where,
          order: [["fecha", "DESC"], ["id", "DESC"]],
        });

        rows = rows.map(r => ({
          tipo: "ctacte",
          id: r.id,
          fecha: r.fecha,
          fecha_pago: r.fecha_pago || null,
          monto: Number(r.importe || 0),
          descripcion: r.descripcion || null,
          proveedor_id: r.proveedor_id || null,
          empresa_id: r.empresa_id || null,
        }));
        break;
      }

      default:
        return res.status(400).json({ error: `medio no soportado: ${medio}` });
    }

    res.json(rows);
  } catch (e) {
    console.error("listarDisponibles", e);
    res.status(500).json({ error: "Error listando movimientos disponibles" });
  }
}
