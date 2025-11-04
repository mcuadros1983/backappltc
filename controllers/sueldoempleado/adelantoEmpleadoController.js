import { sequelize } from "../../config/database.js";
import { Op } from "sequelize";
import AdelantoEmpleado from "../../models/sueldoempleado/adelantoempleado.js";
import MovimientoCajaTesoreria from "../../models/tesoreria/movimientocajatesoreria.js";
import MovimientoBancoTesoreria from "../../models/tesoreria/movimientobancotesoreria.js";
import CategoriaEgreso from "../../models/tesoreria/categoriaEgreso.js";
import Empleado from "../../models/tablas/empleadoModel.js";

// ================== CRUD BÁSICO ==================

// Crear adelanto (solo registro)
export const crearAdelantoEmpleado = async (req, res) => {
  try {
    const adelanto = await AdelantoEmpleado.create(req.body);
    return res.status(201).json(adelanto);
  } catch (error) {
    return res.status(500).json({ error: "Error al crear adelanto", detalle: error.message });
  }
};

// Listar adelantos (filtros: empleado_id, fecha_desde, fecha_hasta)
export const listarAdelantosEmpleado = async (req, res) => {
  try {
    const { empleado_id, fecha_desde, fecha_hasta, limit = 200, offset = 0 } = req.query;
    const where = {};
    if (empleado_id) where.empleado_id = Number(empleado_id);
    if (fecha_desde || fecha_hasta) {
      where.fecha = {};
      if (fecha_desde) where.fecha[Op.gte] = fecha_desde;
      if (fecha_hasta) where.fecha[Op.lte] = fecha_hasta;
    }

    const rows = await AdelantoEmpleado.findAll({
      where,
      order: [["fecha", "ASC"], ["id", "ASC"]],
      limit: Number(limit),
      offset: Number(offset),
    });
    return res.json(rows);
  } catch (error) {
    console.error("[listarAdelantosEmpleado] ERROR:", error?.message);
    return res.status(500).json({ error: "Error al listar adelantos", detalle: error.message });
  }
};

// Obtener por ID
export const obtenerAdelantoEmpleadoPorId = async (req, res) => {
  try {
    const row = await AdelantoEmpleado.findByPk(req.params.id);
    if (!row) return res.status(404).json({ error: "Adelanto no encontrado" });
    return res.json(row);
  } catch (error) {
    return res.status(500).json({ error: "Error al obtener adelanto", detalle: error.message });
  }
};

// Actualizar
export const actualizarAdelantoEmpleado = async (req, res) => {
  try {
    const row = await AdelantoEmpleado.findByPk(req.params.id);
    if (!row) return res.status(404).json({ error: "Adelanto no encontrado" });
    await row.update(req.body);
    return res.json(row);
  } catch (error) {
    return res.status(500).json({ error: "Error al actualizar adelanto", detalle: error.message });
  }
};

// Eliminar (hard delete)
export const eliminarAdelantoEmpleado = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const id = Number(req.params.id || 0);
    if (!id) throw new Error("ID inválido");

    // 1) Buscar el adelanto
    const adelanto = await AdelantoEmpleado.findByPk(id, { transaction: t });
    if (!adelanto) {
      await t.rollback();
      return res.status(404).json({ error: "Adelanto no encontrado" });
    }

    // 2) Buscar movimientos asociados (caja/banco) creados con referencia a este adelanto
    const [movsCaja, movsBanco] = await Promise.all([
      MovimientoCajaTesoreria.findAll({
        where: { referencia_tipo: "AdelantoEmpleado", referencia_id: id },
        transaction: t,
      }),
      MovimientoBancoTesoreria.findAll({
        where: { referencia_tipo: "AdelantoEmpleado", referencia_id: id },
        transaction: t,
      }),
    ]);

    // 3) Borrar movimientos de CAJA
    if (movsCaja?.length) {
      for (const m of movsCaja) {
        await m.destroy({ transaction: t });
      }
    }

    // 4) Borrar movimientos de BANCO
    if (movsBanco?.length) {
      for (const m of movsBanco) {
        await m.destroy({ transaction: t });
      }
    }

    // 5) Borrar el adelanto
    await adelanto.destroy({ transaction: t });

    await t.commit();
    return res.json({
      ok: true,
      mensaje: "Adelanto y movimientos asociados eliminados correctamente",
      detalle: {
        adelanto_id: id,
        caja_eliminados: movsCaja?.length || 0,
        banco_eliminados: movsBanco?.length || 0,
      },
    });
  } catch (error) {
    await t.rollback();
    console.error("❌ eliminarAdelantoEmpleado:", error);
    return res
      .status(400)
      .json({ error: error.message || "No se pudo eliminar el adelanto" });
  }
};


// ================== LÓGICA DE NEGOCIO ==================
// POST /adelantosempleado/pagar
// Registra un adelanto y crea el movimiento según medio: 'caja' o 'banco'
export const registrarAdelantoEmpleado = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const {
      empresa_id,
      medio,                     // 'caja' | 'banco'
      caja_id,
      banco_id,
      adelanto,                  // { empleado_id, fecha, monto, observaciones?, formapago_id, categoriaegreso_id, imputacioncontable_id? }
    } = req.body;

    if (!empresa_id) throw new Error("empresa_id requerido");
    if (!adelanto || typeof adelanto !== "object") throw new Error("Datos de adelanto inválidos");

    const N = (n) => Number(n) || 0;

    const empleado_id = N(adelanto.empleado_id);
    if (!empleado_id) throw new Error("empleado_id requerido");
    const monto = N(adelanto.monto);
    if (!(monto > 0)) throw new Error("monto inválido");

    const fecha = adelanto.fecha || new Date().toISOString().slice(0, 10);
    const formapago_id = adelanto.formapago_id ? N(adelanto.formapago_id) : null;
    const observaciones = adelanto.observaciones || null;

    // La categoría define la imputación contable (igual que en otros módulos)
    if (!adelanto.categoriaegreso_id) {
      throw new Error("categoriaegreso_id requerido");
    }
    const categoriaegreso_id = N(adelanto.categoriaegreso_id);

    // Derivar imputación si no vino explícita
    let imputacioncontable_id = adelanto.imputacioncontable_id ? N(adelanto.imputacioncontable_id) : null;
    if (!imputacioncontable_id) {
      const cat = await CategoriaEgreso.findByPk(categoriaegreso_id, { transaction: t });
      if (!cat) throw new Error("La categoría indicada no existe");
      if (!cat.imputacioncontable_id) {
        throw new Error("La categoría no tiene imputación contable asociada");
      }
      imputacioncontable_id = cat.imputacioncontable_id;
    }

    // 1) Crear AdelantoEmpleado (registro base)
    const reg = await AdelantoEmpleado.create(
      {
        empleado_id,
        monto,
        observaciones,
        fecha,
        formapago_id,
      },
      { transaction: t }
    );

    const getNombreEmpleado = async (id, t) => {
      const emp = await Empleado.findByPk(id, { transaction: t });
      const ape = emp?.apellido || "";
      const nom = emp?.nombre || "";
      // fallback razonSocial o "Empleado #id"
      return [ape, nom].filter(Boolean).join(", ") || emp?.razonSocial || `Empleado #${id}`;
    };

    // 2) Crear movimiento según el medio
    const nombreEmp = await getNombreEmpleado(empleado_id, t);
    const desc = nombreEmp;

    if (String(medio).toLowerCase() === "caja") {
      if (!caja_id) throw new Error("caja_id requerido para medio 'caja'");
      await MovimientoCajaTesoreria.create(
        {
          empresa_id,
          tipo: "egreso",
          descripcion: desc,
          monto,
          fecha,
          caja_id: N(caja_id),
          formapago_id,
          referencia_id: reg.id,
          referencia_tipo: "AdelantoEmpleado",
          observaciones,
          anulado: false,
          ordenpago_id: null,
          categoriaegreso_id,
          imputacioncontable_id,
          idempotency_key: null,
        },
        { transaction: t }
      );
    } else if (String(medio).toLowerCase() === "banco") {
      if (!banco_id) throw new Error("banco_id requerido para medio 'banco'");
      await MovimientoBancoTesoreria.create(
        {
          tipo: "egreso",
          descripcion: desc,
          monto,
          fecha,
          banco_id: N(banco_id),
          empresa_id,
          formapago_id,
          referencia_id: reg.id,
          referencia_tipo: "AdelantoEmpleado",
          observaciones,
          anulado: false,
          ordenpago_id: null,
        },
        { transaction: t }
      );
    } else {
      throw new Error("medio inválido (use 'caja' o 'banco')");
    }

    await t.commit();
    return res.status(201).json({
      ok: true,
      mensaje: "Adelanto registrado correctamente",
      adelanto: reg,
    });
  } catch (error) {
    await t.rollback();
    console.error("❌ registrarAdelantoEmpleado:", error);
    return res.status(400).json({ error: error.message || "No se pudo registrar el adelanto" });
  }
};

// PUT /adelantosempleado/:id/anular?soft=1
// Anula movimientos vinculados (caja/banco) y elimina o marca el adelanto
export const anularAdelantoEmpleado = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { motivo } = req.body || {};
    const soft = String(req.query.soft || "") === "1";

    const row = await AdelantoEmpleado.findByPk(id, { transaction: t });
    if (!row) {
      await t.rollback();
      return res.status(404).json({ error: "Adelanto no encontrado" });
    }

    const nota = ` | Anulado adelanto sueldo #${id}${motivo ? ` - Motivo: ${motivo}` : ""} - ${new Date()
      .toISOString()
      .slice(0, 10)}`;

    // Anular movimientos de CAJA vinculados
    const [updCaja] = await MovimientoCajaTesoreria.update(
      {
        anulado: true,
        observaciones: sequelize.literal(
          `COALESCE(observaciones,'') || ${sequelize.escape(nota)}`
        ),
      },
      {
        where: {
          referencia_tipo: "AdelantoEmpleado",
          referencia_id: id,
          [Op.or]: [{ anulado: { [Op.is]: null } }, { anulado: false }],
        },
        transaction: t,
      }
    );

    // Anular movimientos de BANCO vinculados
    const [updBanco] = await MovimientoBancoTesoreria.update(
      {
        anulado: true,
        observaciones: sequelize.literal(
          `COALESCE(observaciones,'') || ${sequelize.escape(nota)}`
        ),
      },
      {
        where: {
          referencia_tipo: "AdelantoEmpleado",
          referencia_id: id,
          [Op.or]: [{ anulado: { [Op.is]: null } }, { anulado: false }],
        },
        transaction: t,
      }
    );

    // Soft flag si el modelo tuviera "anulado" (no lo tiene por ahora); si no, hard delete
    const soportaFlag = !!AdelantoEmpleado.rawAttributes?.anulado;
    if (soft && soportaFlag) {
      await row.update({ anulado: true }, { transaction: t });
    } else {
      await row.destroy({ transaction: t });
    }

    await t.commit();
    return res.json({
      ok: true,
      mensaje: "Adelanto anulado correctamente",
      movimientosCajaActualizados: updCaja,
      movimientosBancoActualizados: updBanco,
      adelantoSoftDelete: soft && soportaFlag ? true : false,
    });
  } catch (error) {
    await t.rollback();
    console.error("❌ anularAdelantoEmpleado:", error);
    return res.status(400).json({ error: error.message || "No se pudo anular el adelanto" });
  }
};
