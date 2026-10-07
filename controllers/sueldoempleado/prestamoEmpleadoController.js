import { Op } from "sequelize";
import { sequelize } from "../../config/database.js";

import PrestamoEmpleado from "../../models/sueldoempleado/prestamoEmpleadoModel.js";
import AdicionalVariable from "../../models/sueldoempleado/adicionalvariable.js";
import EmpleadoTabla from "../../models/tablas/empleadoModel.js";

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
   IMPORTAR PRÉSTAMOS MASIVAMENTE
========================================================= */

export const importarMasivo = async (req, res) => {

    const t = await sequelize.transaction();

    try {

        const { prestamos } = req.body || {};

        if (!Array.isArray(prestamos) || prestamos.length === 0) {
            throw new Error(
                "No se recibieron préstamos para importar."
            );
        }

        const errores = [];
        const prestamosPreparados = [];

        // =====================================================
        // VALIDAR TODAS LAS FILAS ANTES DE INSERTAR
        // =====================================================

        for (let i = 0; i < prestamos.length; i++) {

            const item = prestamos[i] || {};
            const fila = Number(item.fila_excel) || i + 2;

            const empleadoId = Number(item.empleado_id);
            const montoOriginal = Number(item.monto_original);

            // -------------------------------------------------
            // EMPLEADO
            // -------------------------------------------------

            if (
                !Number.isInteger(empleadoId) ||
                empleadoId <= 0
            ) {
                errores.push({
                    fila,
                    campo: "empleado_id",
                    error: "empleado_id inválido.",
                });

                continue;
            }

            // -------------------------------------------------
            // MONTO
            // -------------------------------------------------

            if (!numeroValido(montoOriginal)) {
                errores.push({
                    fila,
                    campo: "monto_original",
                    error:
                        "monto_original debe ser mayor a cero.",
                });

                continue;
            }

            // -------------------------------------------------
            // FECHA OTORGAMIENTO
            // -------------------------------------------------

            if (!item.fecha_otorgamiento) {
                errores.push({
                    fila,
                    campo: "fecha_otorgamiento",
                    error:
                        "fecha_otorgamiento es requerida.",
                });

                continue;
            }

            // -------------------------------------------------
            // PRIMER DESCUENTO
            // -------------------------------------------------

            if (
                item.fecha_primer_descuento &&
                String(item.fecha_primer_descuento) <
                String(item.fecha_otorgamiento)
            ) {
                errores.push({
                    fila,
                    campo: "fecha_primer_descuento",
                    error:
                        "La fecha del primer descuento no puede ser anterior a la fecha de otorgamiento.",
                });

                continue;
            }

            // -------------------------------------------------
            // PREPARAR
            // -------------------------------------------------

            prestamosPreparados.push({
                fila,

                numero:
                    item.numero === null ||
                        item.numero === undefined ||
                        String(item.numero).trim() === ""
                        ? null
                        : String(item.numero).trim(),

                empleado_id: empleadoId,

                monto_original: montoOriginal,

                saldo: montoOriginal,

                fecha_otorgamiento:
                    item.fecha_otorgamiento,

                fecha_primer_descuento:
                    item.fecha_primer_descuento || null,

                estado: "pendiente",

                observaciones:
                    item.observaciones === null ||
                        item.observaciones === undefined ||
                        String(item.observaciones).trim() === ""
                        ? null
                        : String(item.observaciones).trim(),
            });
        }

        // =====================================================
        // SI HAY ERRORES, NO INSERTAMOS NADA
        // =====================================================

        if (errores.length > 0) {

            await t.rollback();

            return res.status(400).json({
                error:
                    "La importación contiene filas con errores.",
                errores,
            });
        }

        // =====================================================
        // VALIDAR QUE LOS EMPLEADOS EXISTAN
        // =====================================================

        const empleadosIds = [
            ...new Set(
                prestamosPreparados.map(
                    (item) => Number(item.empleado_id)
                )
            ),
        ];

        const empleadosExistentes =
            await EmpleadoTabla.findAll({
                where: {
                    id: {
                        [Op.in]: empleadosIds,
                    },
                },
                attributes: [
                    "id",
                    "numero",
                    "apellido",
                    "nombre",
                    "fechabaja",
                ],
                transaction: t,
            });

        const empleadosExistentesIds =
            new Set(
                empleadosExistentes.map(
                    (empleado) => Number(empleado.id)
                )
            );

        for (const item of prestamosPreparados) {

            if (
                !empleadosExistentesIds.has(
                    Number(item.empleado_id)
                )
            ) {
                errores.push({
                    fila: item.fila,
                    campo: "empleado_id",
                    error:
                        `El empleado ID ${item.empleado_id} no existe.`,
                });
            }
        }

        if (errores.length > 0) {

            await t.rollback();

            return res.status(400).json({
                error:
                    "La importación contiene empleados inexistentes.",
                errores,
            });
        }

        // =====================================================
        // CONTROLAR NÚMEROS DUPLICADOS DENTRO DEL ARCHIVO
        // =====================================================

        const numerosArchivo = new Map();

        for (const item of prestamosPreparados) {

            if (!item.numero) {
                continue;
            }

            if (numerosArchivo.has(item.numero)) {

                errores.push({
                    fila: item.fila,
                    campo: "numero",
                    error:
                        `El número de préstamo "${item.numero}" está repetido dentro del archivo.`,
                });

            } else {

                numerosArchivo.set(
                    item.numero,
                    item.fila
                );
            }
        }

        if (errores.length > 0) {

            await t.rollback();

            return res.status(400).json({
                error:
                    "La importación contiene números de préstamo duplicados.",
                errores,
            });
        }

        // =====================================================
        // CONTROLAR NÚMEROS QUE YA EXISTEN EN LA BASE
        // =====================================================

        const numeros = prestamosPreparados
            .map((item) => item.numero)
            .filter(Boolean);

        if (numeros.length > 0) {

            const existentes =
                await PrestamoEmpleado.findAll({
                    where: {
                        numero: {
                            [Op.in]: numeros,
                        },
                    },
                    attributes: [
                        "id",
                        "numero",
                    ],
                    transaction: t,
                });

            if (existentes.length > 0) {

                const numerosExistentes =
                    new Set(
                        existentes.map(
                            (p) => String(p.numero)
                        )
                    );

                for (const item of prestamosPreparados) {

                    if (
                        item.numero &&
                        numerosExistentes.has(
                            String(item.numero)
                        )
                    ) {
                        errores.push({
                            fila: item.fila,
                            campo: "numero",
                            error:
                                `El número de préstamo "${item.numero}" ya existe.`,
                        });
                    }
                }
            }
        }

        if (errores.length > 0) {

            await t.rollback();

            return res.status(400).json({
                error:
                    "Existen préstamos que no pueden importarse.",
                errores,
            });
        }

        // =====================================================
        // CREAR TODOS LOS PRÉSTAMOS
        // =====================================================

        const creados = [];

        for (const item of prestamosPreparados) {

            const {
                fila,
                ...datosPrestamo
            } = item;

            const prestamo =
                await PrestamoEmpleado.create(
                    datosPrestamo,
                    {
                        transaction: t,
                    }
                );

            creados.push(prestamo);
        }

        await t.commit();

        return res.status(201).json({
            mensaje:
                "Préstamos importados correctamente.",

            cantidad: creados.length,

            prestamos: creados,
        });

    } catch (error) {

        if (!t.finished) {
            await t.rollback();
        }

        console.error(
            "❌ importarMasivo PrestamoEmpleado:",
            error
        );

        return res.status(400).json({
            error:
                error.message ||
                "Error importando préstamos.",
        });
    }
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