import { Op } from "sequelize";
import { sequelize } from "../../config/database.js";

import PrestamoEmpleado from "../../models/sueldoempleado/prestamoEmpleadoModel.js";
import AdicionalVariable from "../../models/sueldoempleado/adicionalvariable.js";

import {
    recalcularSaldoPrestamo,
} from "../../services/sueldos/prestamoEmpleadoService.js";


const ESTADOS_VALIDOS = [
    "pendiente",
    "activo",
    "cancelado",
    "anulado",
];


const numeroValido = (v) => {
    const n = Number(v);
    return Number.isFinite(n) && n > 0;
};


/* =========================================================
   CREAR PRÉSTAMO
========================================================= */

export const crear = async (req, res) => {
    const t = await sequelize.transaction();

    try {
        const {
            numero,
            empleado_id,
            monto_original,
            fecha_otorgamiento,
            fecha_primer_descuento,
            observaciones,
        } = req.body || {};

        const empleadoId = Number(empleado_id);
        const montoOriginal = Number(monto_original);

        if (!empleadoId) {
            throw new Error("empleado_id es requerido.");
        }

        if (!numeroValido(montoOriginal)) {
            throw new Error("monto_original debe ser mayor a cero.");
        }

        if (!fecha_otorgamiento) {
            throw new Error("fecha_otorgamiento es requerida.");
        }

        const prestamo = await PrestamoEmpleado.create(
            {
                numero:
                    numero === null || numero === undefined || numero === ""
                        ? null
                        : String(numero).trim(),

                empleado_id: empleadoId,

                monto_original: montoOriginal,

                // Al crearlo no tiene pagos.
                saldo: montoOriginal,

                fecha_otorgamiento,

                fecha_primer_descuento:
                    fecha_primer_descuento || null,

                estado: "pendiente",

                observaciones:
                    observaciones === null ||
                        observaciones === undefined ||
                        observaciones === ""
                        ? null
                        : String(observaciones).trim(),
            },
            {
                transaction: t,
            }
        );

        await t.commit();

        return res.status(201).json(prestamo);

    } catch (error) {
        await t.rollback();

        console.error("❌ crear PrestamoEmpleado:", error);

        return res.status(400).json({
            error: error.message || "Error creando préstamo.",
        });
    }
};


/* =========================================================
   LISTAR
========================================================= */

export const listar = async (req, res) => {
    try {
        const where = {};

        if (req.query.empleado_id) {
            where.empleado_id = Number(req.query.empleado_id);
        }

        if (req.query.estado) {
            where.estado = String(req.query.estado);
        }

        const rows = await PrestamoEmpleado.findAll({
            where,
            order: [
                ["fecha_otorgamiento", "DESC"],
                ["id", "DESC"],
            ],
        });

        return res.status(200).json(rows);

    } catch (error) {
        console.error("❌ listar PrestamoEmpleado:", error);

        return res.status(500).json({
            error: "Error listando préstamos.",
            detalle: error.message,
        });
    }
};


/* =========================================================
   OBTENER UNO
========================================================= */

export const obtener = async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!id) {
            return res.status(400).json({
                error: "ID inválido.",
            });
        }

        const prestamo = await PrestamoEmpleado.findByPk(id, {
            include: [
                {
                    model: AdicionalVariable,
                    as: "Cuotas",
                    required: false,
                },
            ],
        });

        if (!prestamo) {
            return res.status(404).json({
                error: "Préstamo no encontrado.",
            });
        }

        return res.status(200).json(prestamo);

    } catch (error) {
        console.error("❌ obtener PrestamoEmpleado:", error);

        return res.status(500).json({
            error: "Error obteniendo préstamo.",
            detalle: error.message,
        });
    }
};


/* =========================================================
   PRÉSTAMOS DE UN EMPLEADO
========================================================= */

export const listarPorEmpleado = async (req, res) => {
    try {
        const empleadoId = Number(req.params.empleado_id);

        if (!empleadoId) {
            return res.status(400).json({
                error: "empleado_id inválido.",
            });
        }

        const where = {
            empleado_id: empleadoId,
        };

        /*
         * Por defecto devolvemos los préstamos que todavía
         * pueden interesar durante una liquidación.
         */
        if (req.query.todos !== "1") {
            where.estado = {
                [Op.in]: ["pendiente", "activo"],
            };
        }

        const prestamos = await PrestamoEmpleado.findAll({
            where,
            order: [
                ["fecha_otorgamiento", "ASC"],
                ["id", "ASC"],
            ],
        });

        return res.status(200).json(prestamos);

    } catch (error) {
        console.error("❌ listarPorEmpleado:", error);

        return res.status(500).json({
            error: "Error obteniendo préstamos del empleado.",
            detalle: error.message,
        });
    }
};


/* =========================================================
   MODIFICAR DATOS DEL PRÉSTAMO
========================================================= */

export const actualizar = async (req, res) => {
    const t = await sequelize.transaction();

    try {
        const id = Number(req.params.id);

        if (!id) {
            throw new Error("ID inválido.");
        }

        const prestamo = await PrestamoEmpleado.findByPk(id, {
            transaction: t,
            lock: t.LOCK.UPDATE,
        });

        if (!prestamo) {
            await t.rollback();

            return res.status(404).json({
                error: "Préstamo no encontrado.",
            });
        }

        const changes = {};

        if (
            Object.prototype.hasOwnProperty.call(
                req.body,
                "numero"
            )
        ) {
            changes.numero =
                req.body.numero === null ||
                    req.body.numero === ""
                    ? null
                    : String(req.body.numero).trim();
        }

        if (
            Object.prototype.hasOwnProperty.call(
                req.body,
                "fecha_otorgamiento"
            )
        ) {
            if (!req.body.fecha_otorgamiento) {
                throw new Error(
                    "fecha_otorgamiento no puede quedar vacía."
                );
            }

            changes.fecha_otorgamiento =
                req.body.fecha_otorgamiento;
        }

        if (
            Object.prototype.hasOwnProperty.call(
                req.body,
                "fecha_primer_descuento"
            )
        ) {
            changes.fecha_primer_descuento =
                req.body.fecha_primer_descuento || null;
        }

        if (
            Object.prototype.hasOwnProperty.call(
                req.body,
                "observaciones"
            )
        ) {
            changes.observaciones =
                req.body.observaciones === null ||
                    req.body.observaciones === ""
                    ? null
                    : String(req.body.observaciones).trim();
        }

        if (
            Object.prototype.hasOwnProperty.call(
                req.body,
                "monto_original"
            )
        ) {
            const montoOriginal = Number(
                req.body.monto_original
            );

            if (!numeroValido(montoOriginal)) {
                throw new Error(
                    "monto_original debe ser mayor a cero."
                );
            }

            changes.monto_original = montoOriginal;
        }
        /*
         * NO permitimos modificar directamente:
         *
         * empleado_id
         * saldo
         *
         * El monto_original sí puede modificarse,
         * pero el saldo se recalcula automáticamente
         * a partir de las cuotas existentes.
         */

        await prestamo.update(changes, {
            transaction: t,
        });

        // Si cambió el monto original, recalculamos el saldo
        // usando todas las cuotas de préstamo existentes.
        if (
            Object.prototype.hasOwnProperty.call(
                changes,
                "monto_original"
            )
        ) {
            await recalcularSaldoPrestamo(
                prestamo.id,
                t
            );

            // Recargamos para devolver saldo y estado actualizados.
            await prestamo.reload({
                transaction: t,
            });
        }

        await t.commit();

        return res.status(200).json(prestamo);

    } catch (error) {
        await t.rollback();

        console.error("❌ actualizar PrestamoEmpleado:", error);

        return res.status(400).json({
            error: error.message || "Error actualizando préstamo.",
        });
    }
};


/* =========================================================
   ANULAR
========================================================= */

export const anular = async (req, res) => {
    const t = await sequelize.transaction();

    try {
        const id = Number(req.params.id);

        if (!id) {
            throw new Error("ID inválido.");
        }

        const prestamo = await PrestamoEmpleado.findByPk(id, {
            transaction: t,
            lock: t.LOCK.UPDATE,
        });

        if (!prestamo) {
            await t.rollback();

            return res.status(404).json({
                error: "Préstamo no encontrado.",
            });
        }

        const cantidadCuotas =
            await AdicionalVariable.count({
                where: {
                    prestamo_id: id,
                },
                transaction: t,
            });

        if (cantidadCuotas > 0) {
            throw new Error(
                "El préstamo tiene descuentos registrados y no puede anularse."
            );
        }

        await prestamo.update(
            {
                estado: "anulado",
            },
            {
                transaction: t,
            }
        );

        await t.commit();

        return res.status(200).json(prestamo);

    } catch (error) {
        await t.rollback();

        console.error("❌ anular PrestamoEmpleado:", error);

        return res.status(400).json({
            error: error.message || "Error anulando préstamo.",
        });
    }
};


/* =========================================================
   RECALCULAR MANUALMENTE

   Muy útil para mantenimiento / diagnóstico.
========================================================= */

export const recalcular = async (req, res) => {
    const t = await sequelize.transaction();

    try {
        const id = Number(req.params.id);

        if (!id) {
            throw new Error("ID inválido.");
        }

        const resultado =
            await recalcularSaldoPrestamo(id, t);

        await t.commit();

        return res.status(200).json(resultado);

    } catch (error) {
        await t.rollback();

        console.error("❌ recalcular PrestamoEmpleado:", error);

        return res.status(400).json({
            error: error.message || "Error recalculando préstamo.",
        });
    }
};