import {
    sequelize,
} from "../config/database.js";

import {
    MotorConcepto,
    MotorConceptoEntidad,
    MotorConceptoEntidadTipo,
} from "../models/motorconceptos/index.js";

import MotorConceptoEntidadAsignacion
    from "../models/motorconceptos/motorConceptoEntidadAsignacionModel.js";

/* ===========================================================
 * Helpers
 * =========================================================== */

const createError = (
    message,
    status = 400
) => {

    const error =
        new Error(message);

    error.status =
        status;

    return error;

};

const getUserId = (
    user
) => {

    if (!user?.id) {

        throw createError(
            "Usuario autenticado no disponible",
            401
        );

    }

    return user.id;

};

const parseInteger = (
    value,
    field
) => {

    const parsed =
        Number.parseInt(
            value,
            10
        );

    if (
        !Number.isInteger(parsed) ||
        parsed <= 0
    ) {

        throw createError(
            `${field} no es válido`
        );

    }

    return parsed;

};

const buildEstadoInicial = () =>
    "PENDIENTE";

/* ===========================================================
 * Obtiene el Tipo de Entidad
 * a partir del código.
 * No depende de ids fijos.
 * =========================================================== */

const getEntidadTipoId =
    async (
        codigo,
        transaction
    ) => {

        const entidadTipo =
            await MotorConceptoEntidadTipo.findOne({

                where: {

                    codigo,

                    activo:
                        true,

                },

                transaction,

            });

        if (!entidadTipo) {

            throw createError(

                `No existe el tipo de entidad ${codigo}`,

                404

            );

        }

        return entidadTipo.id;

    };

/* ===========================================================
 * Devuelve todos los conceptos
 * obligatorios de un tipo de entidad.
 * =========================================================== */

const getConceptosObligatorios =
    async (
        entidadTipoId,
        transaction
    ) => {

        return MotorConcepto.findAll({

            where: {

                activo:
                    true,

            },

            include: [

                {

                    model:
                        MotorConceptoEntidad,

                    as:
                        "entidades",

                    required:
                        true,

                    where: {

                        activo:
                            true,

                        obligatorio:
                            true,

                        entidad_tipo_id:
                            entidadTipoId,

                    },

                },

            ],

            order: [

                [
                    "nombre",
                    "ASC",
                ],

            ],

            transaction,

        });

    };

/* ===========================================================
 * Obtiene las asignaciones existentes
 * =========================================================== */

const getAsignacionesExistentes =
    async (
        entidadTipoId,
        entidadId,
        transaction
    ) => {

        return MotorConceptoEntidadAsignacion.findAll({

            where: {

                entidad_tipo_id:
                    entidadTipoId,

                entidad_id:
                    entidadId,

                activo:
                    true,

            },

            transaction,

        });

    };

/* ===========================================================
 * Convierte las asignaciones existentes
 * en un Map para búsqueda O(1)
 * =========================================================== */

const buildAsignacionesMap =
    (
        asignaciones
    ) => {

        const map =
            new Map();

        asignaciones.forEach(
            asignacion => {

                map.set(

                    Number(
                        asignacion.concepto_id
                    ),

                    asignacion

                );

            }
        );

        return map;

    };

/* ===========================================================
 * Crea una asignación
 * =========================================================== */

const crearAsignacion =
    async (

        userId,

        concepto,

        entidadTipoId,

        entidadId,

        transaction

    ) => {

        return MotorConceptoEntidadAsignacion.create({

            concepto_id:
                concepto.id,

            entidad_tipo_id:
                entidadTipoId,

            entidad_id:
                entidadId,

            registro_actual_id:
                null,

            estado:
                buildEstadoInicial(),

            activo:
                true,

            creado_por:
                userId,

            modificado_por:
                userId,

        }, {

            transaction,

        });

    };

    /* ===========================================================
 * Genera todas las asignaciones obligatorias
 * faltantes para una entidad.
 * =========================================================== */

const generarAsignacionesEntidad =
    async (
        user,
        entidadTipoId,
        entidadId
    ) => {

        const userId =
            getUserId(user);

        entidadTipoId =
            parseInteger(
                entidadTipoId,
                "entidad_tipo_id"
            );

        entidadId =
            parseInteger(
                entidadId,
                "entidad_id"
            );

        return sequelize.transaction(

            async (
                transaction
            ) => {

                /*
                =====================================
                Conceptos obligatorios
                =====================================
                */

                const conceptos =
                    await getConceptosObligatorios(

                        entidadTipoId,

                        transaction

                    );

                if (
                    !conceptos.length
                ) {

                    return {

                        creadas: [],

                        existentes: [],

                        total: 0,

                    };

                }

                /*
                =====================================
                Asignaciones existentes
                =====================================
                */

                const existentes =
                    await getAsignacionesExistentes(

                        entidadTipoId,

                        entidadId,

                        transaction

                    );

                const existentesMap =
                    buildAsignacionesMap(
                        existentes
                    );

                /*
                =====================================
                Crear faltantes
                =====================================
                */

                const creadas = [];

                for (
                    const concepto of conceptos
                ) {

                    if (

                        existentesMap.has(

                            Number(
                                concepto.id
                            )

                        )

                    ) {

                        continue;

                    }

                    const asignacion =
                        await crearAsignacion(

                            userId,

                            concepto,

                            entidadTipoId,

                            entidadId,

                            transaction

                        );

                    creadas.push(
                        asignacion
                    );

                    existentesMap.set(

                        Number(
                            concepto.id
                        ),

                        asignacion

                    );

                }

                /*
                =====================================
                Resultado
                =====================================
                */

                return {

                    creadas,

                    existentes:
                        Array.from(
                            existentesMap.values()
                        ),

                    total:
                        existentesMap.size,

                };

            }

        );

    };

    /* ===========================================================
 * Sincroniza las asignaciones de una entidad
 *
 * - Crea las faltantes
 * - Inactiva las que ya no corresponden
 * - Mantiene las existentes
 * =========================================================== */

const sincronizarAsignacionesEntidad =
    async (
        user,
        entidadTipoId,
        entidadId
    ) => {

        const userId =
            getUserId(user);

        entidadTipoId =
            parseInteger(
                entidadTipoId,
                "entidad_tipo_id"
            );

        entidadId =
            parseInteger(
                entidadId,
                "entidad_id"
            );

        return sequelize.transaction(

            async (
                transaction
            ) => {

                /*
                ======================================
                Primero genera las nuevas
                ======================================
                */

                const resultado =
                    await generarAsignacionesEntidad(

                        user,

                        entidadTipoId,

                        entidadId

                    );

                /*
                ======================================
                Conceptos obligatorios actuales
                ======================================
                */

                const conceptos =
                    await getConceptosObligatorios(

                        entidadTipoId,

                        transaction

                    );

                const conceptosMap =
                    new Set(

                        conceptos.map(
                            concepto =>
                                Number(
                                    concepto.id
                                )
                        )

                    );

                /*
                ======================================
                Todas las asignaciones activas
                ======================================
                */

                const asignaciones =
                    await getAsignacionesExistentes(

                        entidadTipoId,

                        entidadId,

                        transaction

                    );

                const eliminadas = [];

                /*
                ======================================
                Si un concepto dejó de ser obligatorio
                se marca como inactivo.
                Nunca se elimina físicamente.
                ======================================
                */

                for (
                    const asignacion of asignaciones
                ) {

                    if (

                        conceptosMap.has(

                            Number(
                                asignacion.concepto_id
                            )

                        )

                    ) {

                        continue;

                    }

                    await asignacion.update({

                        activo:
                            false,

                        modificado_por:
                            userId,

                    }, {

                        transaction,

                    });

                    eliminadas.push(
                        asignacion.id
                    );

                }

                /*
                ======================================
                Resultado
                ======================================
                */

                return {

                    creadas:
                        resultado.creadas,

                    existentes:
                        resultado.existentes,

                    eliminadas,

                    total:
                        resultado.total,

                };

            }

        );

    };

/* ===========================================================
 * Wrappers para cada tipo de entidad
 * =========================================================== */

const generarAsignacionesEmpleado =
    async (
        user,
        empleadoId
    ) => {

        const entidadTipoId =
            await getEntidadTipoId(
                "EMPLEADO"
            );

        return generarAsignacionesEntidad(

            user,

            entidadTipoId,

            empleadoId

        );

    };

const generarAsignacionesSucursal =
    async (
        user,
        sucursalId
    ) => {

        const entidadTipoId =
            await getEntidadTipoId(
                "SUCURSAL"
            );

        return generarAsignacionesEntidad(

            user,

            entidadTipoId,

            sucursalId

        );

    };

const generarAsignacionesEmpresa =
    async (
        user,
        empresaId
    ) => {

        const entidadTipoId =
            await getEntidadTipoId(
                "EMPRESA"
            );

        return generarAsignacionesEntidad(

            user,

            entidadTipoId,

            empresaId

        );

    };

    /* ===========================================================
 * Sincronizar Empleado
 * =========================================================== */

const sincronizarEmpleado =
    async (
        user,
        empleadoId
    ) => {

        const entidadTipoId =
            await getEntidadTipoId(
                "EMPLEADO"
            );

        return sincronizarAsignacionesEntidad(

            user,

            entidadTipoId,

            empleadoId

        );

    };

/* ===========================================================
 * Sincronizar Sucursal
 * =========================================================== */

const sincronizarSucursal =
    async (
        user,
        sucursalId
    ) => {

        const entidadTipoId =
            await getEntidadTipoId(
                "SUCURSAL"
            );

        return sincronizarAsignacionesEntidad(

            user,

            entidadTipoId,

            sucursalId

        );

    };

/* ===========================================================
 * Sincronizar Empresa
 * =========================================================== */

const sincronizarEmpresa =
    async (
        user,
        empresaId
    ) => {

        const entidadTipoId =
            await getEntidadTipoId(
                "EMPRESA"
            );

        return sincronizarAsignacionesEntidad(

            user,

            entidadTipoId,

            empresaId

        );

    };

/* ===========================================================
 * Sincronizar múltiples entidades
 *
 * Muy útil para procesos batch,
 * tareas programadas o migraciones.
 * =========================================================== */

const sincronizarMultiples =
    async (
        user,
        entidadTipoId,
        entidades = []
    ) => {

        const resultado = [];

        for (
            const entidadId of entidades
        ) {

            resultado.push(

                await sincronizarAsignacionesEntidad(

                    user,

                    entidadTipoId,

                    entidadId

                )

            );

        }

        return resultado;

    };

/* ===========================================================
 * Regenerar completamente
 *
 * Elimina asignaciones inactivas,
 * vuelve a generar las obligatorias.
 * Se utilizará solamente para tareas
 * administrativas.
 * =========================================================== */

const regenerarEntidad =
    async (
        user,
        entidadTipoId,
        entidadId
    ) => {

        const userId =
            getUserId(user);

        return sequelize.transaction(

            async (
                transaction
            ) => {

                await MotorConceptoEntidadAsignacion.update(

                    {

                        activo: false,

                        modificado_por:
                            userId,

                    },

                    {

                        where: {

                            entidad_tipo_id:
                                entidadTipoId,

                            entidad_id:
                                entidadId,

                            activo: true,

                        },

                        transaction,

                    }

                );

                return generarAsignacionesEntidad(

                    user,

                    entidadTipoId,

                    entidadId

                );

            }

        );

    };

/* ===========================================================
 * Export
 * =========================================================== */

export default {

    /*
    =====================================
    Principal
    =====================================
    */

    generarAsignacionesEntidad,

    sincronizarAsignacionesEntidad,

    regenerarEntidad,

    /*
    =====================================
    Empleados
    =====================================
    */

    generarAsignacionesEmpleado,

    sincronizarEmpleado,

    /*
    =====================================
    Empresas
    =====================================
    */

    generarAsignacionesEmpresa,

    sincronizarEmpresa,

    /*
    =====================================
    Sucursales
    =====================================
    */

    generarAsignacionesSucursal,

    sincronizarSucursal,

    /*
    =====================================
    Utilidades
    =====================================
    */

    sincronizarMultiples,

};