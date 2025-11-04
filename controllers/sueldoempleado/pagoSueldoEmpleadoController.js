// controllers/sueldoempleado/pagoSueldoEmpleadoController.js
import PagoSueldoEmpleado from "../../models/sueldoempleado/pagosueldoempleado.js";
import { sequelize } from "../../config/database.js";
import { Op } from "sequelize";
import Empleado from "../../models/tablas/empleadoModel.js";

// Ajustá los imports según tus rutas reales de modelos:
import MovimientoCajaTesoreria from "../../models/tesoreria/movimientocajatesoreria.js";
import MovimientoBancoTesoreria from "../../models/tesoreria/movimientobancotesoreria.js";
import CategoriaEgreso from "../../models/tesoreria/categoriaEgreso.js";

// Crear pago
export const crearPagoSueldoEmpleado = async (req, res) => {
  try {
    const pago = await PagoSueldoEmpleado.create(req.body);
    res.status(201).json(pago);
  } catch (error) {
    res.status(500).json({ error: "Error al crear el pago", detalle: error.message });
  }
};

// Listar todos los pagos
export const listarPagosSueldoEmpleado = async (req, res) => {
  try {
    const pagos = await PagoSueldoEmpleado.findAll();
    res.status(200).json(pagos);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener los pagos" });
  }
};

// Obtener por ID
export const obtenerPagoSueldoEmpleadoPorId = async (req, res) => {
  try {
    const pago = await PagoSueldoEmpleado.findByPk(req.params.id);
    if (!pago) return res.status(404).json({ error: "Pago no encontrado" });
    res.status(200).json(pago);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener el pago" });
  }
};

// Actualizar pago
export const actualizarPagoSueldoEmpleado = async (req, res) => {
  try {
    const pago = await PagoSueldoEmpleado.findByPk(req.params.id);
    if (!pago) return res.status(404).json({ error: "Pago no encontrado" });
    await pago.update(req.body);
    res.status(200).json(pago);
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar el pago" });
  }
};

/**
 * DELETE /sueldos/pagos/:id
 * Elimina un PagoSueldoEmpleado y su movimiento de tesorería asociado (caja o banco).
 * - Busca el movimiento por referencia_tipo="PagoSueldoEmpleado" y referencia_id=id
 * - Realiza todo dentro de una transacción
 * - Con locks para evitar condiciones de carrera
 * - Opcional: modo "soft" para no borrar físicamente el movimiento y marcarlo anulado (query ?soft=true)
 */
export const eliminarPagoSueldoEmpleado = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const soft = String(req.query.soft || "").toLowerCase() === "true"; // ?soft=true para "anular" el movimiento en vez de borrar

    // 1) Traer el pago con LOCK
    const pago = await PagoSueldoEmpleado.findByPk(id, {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!pago) {
      await t.rollback();
      return res.status(404).json({ error: "Pago no encontrado" });
    }

    // 2) Buscar movimiento de CAJA o BANCO asociado (referencia_tipo + referencia_id)
    //    Nota: por diseño debería existir solo uno; si hay ambos, es un estado inconsistente.
    const [movCaja, movBanco] = await Promise.all([
      MovimientoCajaTesoreria.findOne({
        where: { referencia_tipo: "PagoSueldoEmpleado", referencia_id: pago.id },
        transaction: t,
        lock: t.LOCK.UPDATE,
      }),
      MovimientoBancoTesoreria.findOne({
        where: { referencia_tipo: "PagoSueldoEmpleado", referencia_id: pago.id },
        transaction: t,
        lock: t.LOCK.UPDATE,
      }),
    ]);

    if (movCaja && movBanco) {
      // Regla defensiva: no debería ocurrir (un pago no puede ser por caja y banco a la vez)
      await t.rollback();
      return res.status(409).json({
        error:
          "Inconsistencia: el pago tiene movimientos asociados en CAJA y BANCO. Revisar datos antes de eliminar.",
      });
    }

    // 3) Validaciones de negocio opcionales (descomentar si aplican en tu dominio):
    // - Evitar eliminar si el movimiento está conciliado, aplicado a otra entidad, etc.
    // if (movCaja?.conciliado || movBanco?.conciliado) {
    //   await t.rollback();
    //   return res.status(400).json({ error: "No se puede eliminar: el movimiento está conciliado" });
    // }

    // 4) Eliminar/anular el movimiento asociado (si existe)
    let movimientoEliminado = null;
    if (movCaja) {
      if (soft) {
        await movCaja.update({ anulado: true }, { transaction: t });
        movimientoEliminado = { medio: "caja", id: movCaja.id, anulado: true };
      } else {
        await movCaja.destroy({ transaction: t /* , force: true */ });
        movimientoEliminado = { medio: "caja", id: movCaja.id, eliminado: true };
      }
    } else if (movBanco) {
      if (soft) {
        await movBanco.update({ anulado: true }, { transaction: t });
        movimientoEliminado = { medio: "banco", id: movBanco.id, anulado: true };
      } else {
        await movBanco.destroy({ transaction: t /* , force: true */ });
        movimientoEliminado = { medio: "banco", id: movBanco.id, eliminado: true };
      }
    }

    // 5) Eliminar el PAGO en sí
    await pago.destroy({ transaction: t /* , force: true */ });

    // 6) Commit
    await t.commit();
    return res.status(200).json({
      ok: true,
      mensaje: "Pago eliminado correctamente",
      detalle: {
        pago_id: Number(id),
        movimiento: movimientoEliminado, // null si no se encontró
      },
    });
  } catch (error) {
    await t.rollback();
    console.error("[eliminarPagoSueldoEmpleado] ERROR:", error?.message, error?.stack);
    return res.status(500).json({ error: "Error al eliminar el pago" });
  }
};

/**
 * POST /pagossueldoempleado/pagar
 * Paga sueldo con movimiento en CAJA o BANCO y luego registra el PagoSueldoEmpleado.
 * Todo en una transacción. Opcional: idempotencyKey para evitar dobles envíos.
 *
 * Body esperado:
 * {
 *   empresa_id: number,
 *   medio: "caja"|"banco",
 *   idempotencyKey?: string,
 *   caja_id?: number,        // requerido si medio="caja"
 *   banco_id?: number,       // requerido si medio="banco"
 *   pago: {
 *     empleado_id: number,
 *     fecha: "YYYY-MM-DD",
 *     descripcion: string,
 *     importe: number,
 *     formapago_id: number|null,
 *     proyecto_id?: number|null,
 *     categoriaegreso_id: number,           // ej: "Sueldos y Jornales"
 *     imputacioncontable_id?: number|null   // si no viene, se deriva de la categoría
 *   }
 * }
 */
export const pagarSueldoEmpleado = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { empresa_id, medio, idempotencyKey, caja_id, banco_id, pago } = req.body;

    const getNombreEmpleado = async (id, t) => {
      const emp = await Empleado.findByPk(id, { transaction: t });
      const ape = emp?.apellido || "";
      const nom = emp?.nombre || "";
      return [ape, nom].filter(Boolean).join(", ") || emp?.razonSocial || `Empleado #${id}`;
    };

    if (!empresa_id) throw new Error("empresa_id requerido");
    if (!pago || typeof pago !== "object") throw new Error("Datos de pago inválidos");
    if (!pago.empleado_id) throw new Error("empleado_id requerido");
    if (!pago.fecha) throw new Error("fecha requerida");
    const importe = Number(pago.importe || 0);
    if (!(importe > 0)) throw new Error("importe inválido");
    if (!pago.categoriaegreso_id) throw new Error("categoriaegreso_id requerido");
    if (!medio || !["caja", "banco"].includes(String(medio))) {
      throw new Error("medio inválido (use 'caja' o 'banco')");
    }
    if (medio === "caja" && !caja_id) throw new Error("caja_id requerido para pagos por caja");
    if (medio === "banco" && !banco_id) throw new Error("banco_id requerido para pagos por banco");

    // Idempotencia: si existe un movimiento con esa key y ya está enlazado a un PagoSueldoEmpleado, devuelvo lo existente
    if (idempotencyKey) {
      const mov = await (medio === "caja" ? MovimientoCajaTesoreria : MovimientoBancoTesoreria).findOne({
        where: { idempotency_key: idempotencyKey, referencia_tipo: "PagoSueldoEmpleado" },
        transaction: t,
      });
      if (mov?.referencia_id) {
        const pagoExist = await PagoSueldoEmpleado.findByPk(mov.referencia_id, { transaction: t });
        if (pagoExist) {
          await t.commit();
          return res.status(200).json({ ok: true, reutilizado: true, pago: pagoExist, movimiento: mov });
        }
      }
    }

    // Derivar imputación desde categoría (si no viene explícita)
    let imputacion = pago.imputacioncontable_id || null;
    if (!imputacion && pago.categoriaegreso_id) {
      const cat = await CategoriaEgreso.findByPk(pago.categoriaegreso_id, { transaction: t });
      if (cat?.imputacioncontable_id) imputacion = cat.imputacioncontable_id;
    }
    if (!imputacion) {
      throw new Error("imputacioncontable_id requerido (directo o derivado de la categoría)");
    }

    // ✅ Descripción con nombre de empleado
    const nombreEmp = await getNombreEmpleado(Number(pago.empleado_id), t);
     // const desc = `${nombreEmp} - PAGO DE SUELDO`;
     const desc = nombreEmp;

    const baseMovimiento = {
      empresa_id,
      tipo: "egreso",
      descripcion: desc,
      monto: importe,
      fecha: pago.fecha,
      formapago_id: pago.formapago_id || null,
      observaciones: pago.descripcion?.trim() || null,
      anulado: false,
      categoriaegreso_id: pago.categoriaegreso_id,
      imputacioncontable_id: imputacion,
      proyecto_id: pago.proyecto_id || null,     // si tu modelo de movimiento tiene este campo
      idempotency_key: idempotencyKey || null,
      referencia_tipo: null,
      referencia_id: null,
    };

    let movimiento = null;

    // 1) Registrar el movimiento (CAJA o BANCO)
    if (medio === "caja") {
      movimiento = await MovimientoCajaTesoreria.create(
        { ...baseMovimiento, caja_id: Number(caja_id) },
        { transaction: t }
      );
    } else {
      movimiento = await MovimientoBancoTesoreria.create(
        { ...baseMovimiento, banco_id: Number(banco_id) },
        { transaction: t }
      );
    }

    // 2) Registrar el PagoSueldoEmpleado
    const pagoRow = await PagoSueldoEmpleado.create(
      {
        sueldoId: null,               // lo vas a usar más adelante
        cajaId: medio === "caja" ? String(caja_id) : null,  // opcional para rastreo
        descripcion: desc,
        empleado_id: Number(pago.empleado_id),
        fecha: pago.fecha,
        importe: importe,
        sucursal_id: null,            // por ahora no se usa
        sueldo_id: null,              // por ahora no se usa
        formapago_id: pago.formapago_id || null,
      },
      { transaction: t }
    );

    // 3) Enlazar el movimiento al pago (trazabilidad)
    await movimiento.update(
      {
        referencia_tipo: "PagoSueldoEmpleado",
        referencia_id: pagoRow.id,
      },
      { transaction: t }
    );

    await t.commit();
    return res.status(201).json({ ok: true, mensaje: "Pago de sueldo registrado", pago: pagoRow, movimiento });
  } catch (error) {
    await t.rollback();
    console.error("❌ pagarSueldoEmpleado:", error);
    return res.status(400).json({ error: error.message || "No se pudo registrar el pago de sueldo" });
  }
};