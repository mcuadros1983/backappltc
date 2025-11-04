import { Op } from "sequelize";
import CajaTesoreria from "../../models/tesoreria/cajatesoreria.js";
import IngresoCaja from "../../models/tesoreria/ingresocaja.js";
import EgresoCaja from "../../models/tesoreria/egresocaja.js";

// 1. ABRIR CAJA
const abrirCaja = async (req, res) => {
  try {
    const { usuario_id, caja_inicial, sucursal_id } = req.body;
    const fechaHoy = new Date().toISOString().split("T")[0];

    const existente = await CajaTesoreria.findOne({
      where: {
        usuario_id,
        fecha_apertura: fechaHoy,
        fecha_cierre: { [Op.is]: null }
      }
    });

    if (existente) {
      return res.status(400).json({ message: "Ya hay una caja abierta para este usuario hoy." });
    }

    const nuevaCaja = await CajaTesoreria.create({
      usuario_id,
      fecha_apertura: fechaHoy,
      caja_inicial,
      sucursal_id
    });

    res.status(201).json(nuevaCaja);
  } catch (error) {
    console.error("Error al abrir caja:", error);
    res.status(500).json({ message: "Error al abrir la caja." });
  }
};

// 2. VER CAJA ABIERTA ACTUAL
const obtenerCajaAbierta = async (req, res) => {
  try {
    console.log("obteniendo caja abierta...");

    // const { usuario_id } = req.params;

    const caja = await CajaTesoreria.findOne({
      where: {
        // usuario_id,
        fecha_cierre: { [Op.is]: null }  // Eliminamos filtro por fecha
      }
    });

    if (!caja) {
      return res.json({ abierta: false });
    }

    // Sumar ingresos confirmados
    const ingresos = await IngresoCaja.sum("monto", {
      where: {
        caja_id: caja.id,
        // es_confirmado: true
      }
    });

    // Sumar egresos confirmados
    const egresos = await EgresoCaja.sum("monto", {
      where: {
        caja_id: caja.id,
        // es_confirmado: true
      }
    });

    const saldo = parseFloat(caja.caja_inicial) + (ingresos || 0) - (egresos || 0);
    console.log("verificando caja abierta... saldo:", saldo);

    res.json({
      abierta: true,
      caja,
      ingresos: ingresos || 0,
      egresos: egresos || 0,
      saldo: saldo.toFixed(2)
    });

  } catch (error) {
    console.error("Error al obtener caja actual:", error);
    res.status(500).json({ message: "Error al obtener la caja." });
  }
};

// 3. CERRAR CAJA
const cerrarCaja = async (req, res) => {
  try {
    const { usuario_id } = req.body;
    const fechaHoy = new Date().toISOString().split("T")[0];

    const caja = await CajaTesoreria.findOne({
      where: {
        // usuario_id,
        fecha_cierre: { [Op.is]: null }  // Eliminamos filtro por fecha
      }
    });

    if (!caja) {
      return res.status(404).json({ message: "No hay caja abierta para hoy." });
    }

    const ingresos = await IngresoCaja.sum("monto", {
      where: {
        caja_id: caja.id,
        // es_confirmado: true
      }
    });

    const egresos = await EgresoCaja.sum("monto", {
      where: {
        caja_id: caja.id,
        // es_confirmado: true
      }
    });

    const saldoFinal = parseFloat(caja.caja_inicial) + (ingresos || 0) - (egresos || 0);

    caja.caja_final = saldoFinal;
    caja.fecha_cierre = new Date();
    await caja.save();

    res.json({
      message: "Caja cerrada correctamente.",
      caja_id: caja.id,
      saldo_final: saldoFinal.toFixed(2),
      ingresos: ingresos || 0,
      egresos: egresos || 0
    });
  } catch (error) {
    console.error("Error al cerrar caja:", error);
    res.status(500).json({ message: "Error al cerrar caja." });
  }
};

// 4. LISTAR HISTÓRICO DE CAJAS (opcional)
const listarCajasPorUsuario = async (req, res) => {
  try {
    const { usuario_id } = req.params;
    const cajas = await CajaTesoreria.findAll({
      where: { usuario_id },
      order: [['fecha_apertura', 'DESC']]
    });

    res.json(cajas);
  } catch (error) {
    console.error("Error al listar cajas:", error);
    res.status(500).json({ message: "Error al listar cajas del usuario." });
  }
};
// Obtener la última caja cerrada por usuario
const obtenerUltimaCajaCerrada = async (req, res) => {
  try {
    // const { usuario_id } = req.params;

    const ultimaCaja = await CajaTesoreria.findOne({
      where: {
        // usuario_id,
        fecha_cierre: { [Op.not]: null },
      },
      order: [["fecha_cierre", "DESC"]],
    });

    if (!ultimaCaja) {
      return res.json({ existe: false });
    }

    const ingresos = await IngresoCaja.sum("monto", {
      where: { caja_id: ultimaCaja.id },
    });

    const egresos = await EgresoCaja.sum("monto", {
      where: { caja_id: ultimaCaja.id },
    });

    const saldoFinal = parseFloat(ultimaCaja.caja_inicial) + (ingresos || 0) - (egresos || 0);

    return res.json({
      existe: true,
      saldoFinal: saldoFinal.toFixed(2),
    });
  } catch (err) {
    console.error("Error obteniendo última caja cerrada", err);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

export {
  abrirCaja,
  listarCajasPorUsuario,
  cerrarCaja,
  obtenerCajaAbierta,
  obtenerUltimaCajaCerrada
}