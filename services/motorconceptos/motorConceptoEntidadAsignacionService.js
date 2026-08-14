import {
    Op,
} from "sequelize";

import { sequelize } from "../../config/database.js";


import {
    MotorConcepto,
    MotorConceptoEntidad,
    MotorConceptoEntidadTipo,
} from "../../models/motorconceptos/index.js";

import {
    MotorConceptoRegistro,
} from "../../models/motorconceptos/operacionAssociations.js";

import MotorConceptoEntidadAsignacion
    from "../../models/motorconceptos/motorConceptoEntidadAsignacionModel.js";

import motorConceptoAsignacionGenerator
    from "../../libs/motorConceptoAsignacionGenerator.js";

/* ===========================================================
 * Constantes
 * =========================================================== */

const DEFAULT_PAGE = 1;

const DEFAULT_LIMIT = 20;

const MAX_LIMIT = 100;

const ALLOWED_STATES = [
    "PENDIENTE",
    "COMPLETADO",
    "CANCELADO",
];

const ALLOWED_SORT_FIELDS = {
    id: "id",
    concepto_id: "concepto_id",
    entidad_tipo_id: "entidad_tipo_id",
    entidad_id: "entidad_id",
    estado: "estado",
    created_at: "created_at",
    updated_at: "updated_at",
};

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

const parsePositiveInteger = (
    value,
    fallback
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

        return fallback;

    }

    return parsed;

};

const parseOptionalInteger = (
    value,
    fieldName
) => {

    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {

        return null;

    }

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
            `${fieldName} no es válido`
        );

    }

    return parsed;

};

const parseBoolean = (
    value,
    fallback = true
) => {

    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {

        return fallback;

    }

    if (
        value === true ||
        value === "true" ||
        value === "1" ||
        value === 1
    ) {

        return true;

    }

    if (
        value === false ||
        value === "false" ||
        value === "0" ||
        value === 0
    ) {

        return false;

    }

    return fallback;

};

const normalizeText = (
    value
) =>
    String(
        value || ""
    ).trim();

const normalizeState = (
    value
) => {

    const estado =
        normalizeText(value)
            .toUpperCase();

    if (!estado) {

        return null;

    }

    if (
        !ALLOWED_STATES.includes(
            estado
        )
    ) {

        throw createError(
            "Estado inválido"
        );

    }

    return estado;

};

const normalizeOrder = (
    value
) => {

    const order =
        normalizeText(value)
            .toUpperCase();

    return order === "ASC"
        ? "ASC"
        : "DESC";

};

const normalizeSortField = (
    value
) => {

    const field =
        normalizeText(value);

    return (
        ALLOWED_SORT_FIELDS[field] ||
        "created_at"
    );

};

/* ===========================================================
 * Seguridad
 * =========================================================== */

const buildSecurityWhere = (
    user
) => {

    getUserId(user);

    const where = {};

    if (
        Number(user.rol_id) !== 1 &&
        user.sucursal_id
    ) {

        where.sucursal_id =
            user.sucursal_id;

    }

    return where;

};

/* ===========================================================
 * Búsqueda
 * =========================================================== */

const buildSearchWhere = (
    search
) => {

    const value =
        normalizeText(search);

    if (!value) {

        return null;

    }

    const conditions = [
        {
            estado: {
                [Op.like]:
                    `%${value}%`,
            },
        },
    ];

    const numeric =
        Number.parseInt(
            value,
            10
        );

    if (
        Number.isInteger(
            numeric
        )
    ) {

        conditions.push(

            {
                id:
                    numeric,
            },

            {
                entidad_id:
                    numeric,
            },

            {
                concepto_id:
                    numeric,
            }

        );

    }

    return {

        [Op.or]:
            conditions,

    };

};

/* ===========================================================
 * Filtros
 * =========================================================== */

const buildListWhere = (
    user,
    query
) => {

    const where = {
        ...buildSecurityWhere(
            user
        ),
    };

    const conceptoId =
        parseOptionalInteger(
            query.concepto_id,
            "concepto_id"
        );

    const entidadTipoId =
        parseOptionalInteger(
            query.entidad_tipo_id,
            "entidad_tipo_id"
        );

    const entidadId =
        parseOptionalInteger(
            query.entidad_id,
            "entidad_id"
        );

    const registroActualId =
        parseOptionalInteger(
            query.registro_actual_id,
            "registro_actual_id"
        );

    const estado =
        normalizeState(
            query.estado
        );

    const activo =
        parseBoolean(
            query.activo,
            true
        );

    where.activo =
        activo;

    if (
        conceptoId
    ) {

        where.concepto_id =
            conceptoId;

    }

    if (
        entidadTipoId
    ) {

        where.entidad_tipo_id =
            entidadTipoId;

    }

    if (
        entidadId
    ) {

        where.entidad_id =
            entidadId;

    }

    if (
        registroActualId
    ) {

        where.registro_actual_id =
            registroActualId;

    }

    if (
        estado
    ) {

        where.estado =
            estado;

    }

    const searchWhere =
        buildSearchWhere(
            query.search
        );

    if (
        searchWhere
    ) {

        where[Op.and] = [
            searchWhere,
        ];

    }

    return where;

};

/* ===========================================================
 * Paginación
 * =========================================================== */

const getPagination = (
    query
) => {

    const page =
        parsePositiveInteger(
            query.page,
            DEFAULT_PAGE
        );

    const requestedLimit =
        parsePositiveInteger(
            query.limit,
            DEFAULT_LIMIT
        );

    const limit =
        Math.min(
            requestedLimit,
            MAX_LIMIT
        );

    const offset =
        (
            page - 1
        ) * limit;

    return {

        page,

        limit,

        offset,

    };

};

/* ===========================================================
 * Ordenamiento
 * =========================================================== */

const getOrder = (
    query
) => {

    const sortBy =
        normalizeSortField(
            query.sort ||
            query.sortBy
        );

    const direction =
        normalizeOrder(
            query.order ||
            query.sortDirection
        );

    return [

        [
            sortBy,
            direction,
        ],

        [
            "id",
            "DESC",
        ],

    ];

};

/* ===========================================================
 * Includes
 * =========================================================== */

const getListIncludes =
    () => [

        {

            model:
                MotorConcepto,

            as:
                "concepto",

            required:
                true,

        },

        {

            model:
                MotorConceptoEntidadTipo,

            as:
                "entidadTipo",

            required:
                true,

        },

        {

            model:
                MotorConceptoRegistro,

            as:
                "registroActual",

            required:
                false,

        },

    ];

const getDetailIncludes =
    () => [

        {

            model:
                MotorConcepto,

            as:
                "concepto",

        },

        {

            model:
                MotorConceptoEntidadTipo,

            as:
                "entidadTipo",

        },

        {

            model:
                MotorConceptoRegistro,

            as:
                "registroActual",

            required:
                false,

        },

    ];

/* ===========================================================
 * Búsqueda por Id
 * =========================================================== */

const findAccessibleAsignacion =
    async (
        user,
        asignacionId,
        {
            includeDetail = false,
            includeInactive = false,
            includeDeleted = false,
        } = {}
    ) => {

        getUserId(
            user
        );

        const id =
            parseOptionalInteger(
                asignacionId,
                "id"
            );

        const where = {

            id,

            ...buildSecurityWhere(
                user
            ),

        };

        if (
            !includeInactive
        ) {

            where.activo =
                true;

        }

        const asignacion =
            await MotorConceptoEntidadAsignacion.findOne({

                where,

                paranoid:
                    !includeDeleted,

                include:
                    includeDetail
                        ? getDetailIncludes()
                        : getListIncludes(),

            });

        if (
            !asignacion
        ) {

            throw createError(
                "La asignación no existe o no tiene acceso",
                404
            );

        }

        return asignacion;

    };

/* ===========================================================
 * Listado
 * =========================================================== */

const getAll = async (
    user,
    query = {}
) => {

    getUserId(user);

    const {
        page,
        limit,
        offset,
    } = getPagination(query);

    const where =
        buildListWhere(
            user,
            query
        );

    const result =
        await MotorConceptoEntidadAsignacion.findAndCountAll({

            where,

            include:
                getListIncludes(),

            order:
                getOrder(query),

            distinct: true,

            limit,

            offset,

        });

    return {

        items:
            result.rows,

        pagination: {

            page,

            limit,

            total:
                result.count,

            totalPages:
                Math.ceil(
                    result.count / limit
                ),

        },

    };

};

/* ===========================================================
 * Obtener por Id
 * =========================================================== */

const getById = async (
    user,
    asignacionId
) => {

    return findAccessibleAsignacion(

        user,

        asignacionId,

        {

            includeDetail:
                true,

        }

    );

};

// const getByEntidad = async (
//   user,
//   entidadTipoId,
//   entidadId
// ) => {

//   getUserId(user);

//   entidadTipoId =
//     parseOptionalInteger(
//       entidadTipoId,
//       "entidad_tipo_id"
//     );

//   entidadId =
//     parseOptionalInteger(
//       entidadId,
//       "entidad_id"
//     );

//   /*
//   ===========================================
//   Siempre sincroniza antes de consultar.
//   ===========================================
//   */

//   await motorConceptoAsignacionGenerator
//     .sincronizarAsignacionesEntidad(

//       user,

//       entidadTipoId,

//       entidadId

//     );

//   /*
//   ===========================================
//   Devuelve todas las asignaciones
//   ===========================================
//   */

//   return MotorConceptoEntidadAsignacion.findAll({

//     where: {

//       entidad_tipo_id:
//         entidadTipoId,

//       entidad_id:
//         entidadId,

//       activo: true,

//       ...buildSecurityWhere(
//         user
//       ),

//     },

//     include:
//       getDetailIncludes(),

//     order: [

//       [

//         {

//           model:
//             MotorConcepto,

//           as:
//             "concepto",

//         },

//         "nombre",

//         "ASC",

//       ],

//     ],

//   });

// };

const getByEntidad = async (
    user,
    entidadTipoId,
    entidadId
) => {

    getUserId(
        user
    );

    entidadTipoId =
        parseOptionalInteger(
            entidadTipoId,
            "entidad_tipo_id"
        );

    entidadId =
        parseOptionalInteger(
            entidadId,
            "entidad_id"
        );


    /*
     * Mantiene la lógica existente:
     *
     * Los conceptos obligatorios configurados
     * para el tipo de entidad deben existir
     * como asignaciones.
     */

    await motorConceptoAsignacionGenerator
        .sincronizarAsignacionesEntidad(
            user,
            entidadTipoId,
            entidadId
        );


    /*
     * Las asignaciones determinan qué
     * conceptos deben mostrarse.
     *
     * No utilizamos su estado ni su
     * registro_actual_id como fuente
     * documental.
     */

    const asignaciones =
        await MotorConceptoEntidadAsignacion
            .findAll({

                where: {

                    entidad_tipo_id:
                        entidadTipoId,

                    entidad_id:
                        entidadId,

                    activo:
                        true,

                    ...buildSecurityWhere(
                        user
                    ),

                },

                include:
                    getDetailIncludes(),

                order: [

                    [

                        {
                            model:
                                MotorConcepto,

                            as:
                                "concepto",
                        },

                        "nombre",

                        "ASC",

                    ],

                ],

            });


    if (
        asignaciones.length === 0
    ) {

        return [];

    }


    /*
     * Obtenemos todos los registros activos
     * de esta entidad en una sola consulta.
     *
     * Evitamos realizar una consulta SQL
     * por cada asignación.
     */

    const registros =
        await MotorConceptoRegistro
            .findAll({

                where: {

                    entidad_tipo_id:
                        entidadTipoId,

                    entidad_id:
                        entidadId,

                    activo:
                        true,

                },

                order: [

                    [
                        "ultimo_movimiento",
                        "DESC",
                    ],

                    [
                        "id",
                        "DESC",
                    ],

                ],

            });


    /*
     * Registro actual por concepto.
     *
     * Como los registros vienen ordenados
     * del más reciente al más antiguo,
     * conservamos el primero encontrado.
     */

    const registrosPorConcepto =
        new Map();


    registros.forEach(
        (
            registro
        ) => {

            const conceptoId =
                Number(
                    registro.concepto_id
                );


            if (
                registrosPorConcepto
                    .has(
                        conceptoId
                    )
            ) {
                return;
            }


            registrosPorConcepto
                .set(
                    conceptoId,
                    registro
                );

        }
    );


    /*
     * Construimos la vista documental.
     *
     * La asignación define qué mostrar.
     * El registro define si está completado
     * y cuál es su estado real.
     */

    return asignaciones.map(
        (
            asignacion
        ) => {

            const item =
                asignacion.toJSON();


            const registro =
                registrosPorConcepto
                    .get(
                        Number(
                            item.concepto_id
                        )
                    ) ||
                null;


            /*
             * Todavía no existe registro.
             */

            if (
                !registro
            ) {

                return {

                    ...item,

                    registro_actual_id:
                        null,

                    registroActual:
                        null,

                    estado:
                        "PENDIENTE",

                };

            }


            const registroData =
                registro.toJSON();

            let estadoVisual =
                registroData.estado;

            let diasRestantes =
                null;

            if (
                registroData.fecha_vencimiento
            ) {

                const hoy =
                    new Date();

                hoy.setHours(
                    0,
                    0,
                    0,
                    0
                );

                const fechaVencimiento =
                    new Date(
                        `${registroData.fecha_vencimiento}T00:00:00`
                    );

                fechaVencimiento.setHours(
                    0,
                    0,
                    0,
                    0
                );

                diasRestantes =
                    Math.ceil(
                        (
                            fechaVencimiento -
                            hoy
                        ) /
                        (
                            1000 *
                            60 *
                            60 *
                            24
                        )
                    );

                if (
                    diasRestantes < 0
                ) {

                    estadoVisual =
                        "VENCIDO";

                } else {

                    const diasAlerta =
                        Number(
                            item.concepto
                                ?.dias_alerta_vencimiento ||
                            0
                        );

                    if (
                        diasAlerta > 0 &&
                        diasRestantes <=
                        diasAlerta
                    ) {

                        estadoVisual =
                            "POR_VENCER";

                    }

                }

            }

            return {

                ...item,

                registro_actual_id:
                    registroData.id,

                registroActual: {

                    ...registroData,

                    estado_visual:
                        estadoVisual,

                    dias_restantes:
                        diasRestantes,

                },

                estado:
                    estadoVisual,

                estado_visual:
                    estadoVisual,

                dias_restantes:
                    diasRestantes,

            };

        }
    );

};

/* ===========================================================
* Crear
* =========================================================== */

const create = async (
    user,
    payload
) => {

    const userId =
        getUserId(user);

    if (!payload.concepto_id) {
        throw createError(
            "concepto_id es obligatorio"
        );
    }

    if (!payload.entidad_tipo_id) {
        throw createError(
            "entidad_tipo_id es obligatorio"
        );
    }

    if (!payload.entidad_id) {
        throw createError(
            "entidad_id es obligatorio"
        );
    }

    return sequelize.transaction(
        async (
            transaction
        ) => {

            const concepto =
                await MotorConcepto.findOne({

                    where: {

                        id:
                            payload.concepto_id,

                        activo:
                            true,

                    },

                    transaction,

                });

            if (!concepto) {

                throw createError(
                    "Concepto no encontrado"
                );

            }

            const relacion =
                await MotorConceptoEntidad.findOne({

                    where: {

                        concepto_id:
                            payload.concepto_id,

                        entidad_tipo_id:
                            payload.entidad_tipo_id,

                        activo:
                            true,

                    },

                    transaction,

                });

            if (!relacion) {

                throw createError(
                    "El tipo de entidad no está habilitado para este concepto"
                );

            }

            const existe =
                await MotorConceptoEntidadAsignacion.findOne({

                    where: {

                        concepto_id:
                            payload.concepto_id,

                        entidad_tipo_id:
                            payload.entidad_tipo_id,

                        entidad_id:
                            payload.entidad_id,

                        activo:
                            true,

                    },

                    transaction,

                });

            if (existe) {

                throw createError(
                    "La asignación ya existe"
                );

            }

            const asignacion =
                await MotorConceptoEntidadAsignacion.create({

                    concepto_id:
                        payload.concepto_id,

                    entidad_tipo_id:
                        payload.entidad_tipo_id,

                    entidad_id:
                        payload.entidad_id,

                    registro_actual_id:
                        payload.registro_actual_id ||
                        null,

                    estado:
                        payload.estado ||
                        "PENDIENTE",

                    activo:
                        true,

                    creado_por:
                        userId,

                    modificado_por:
                        userId,

                }, {
                    transaction,
                });

            return findAccessibleAsignacion(

                user,

                asignacion.id,

                {

                    includeDetail:
                        true,

                }

            );

        }

    );

};

/* ===========================================================
 * Actualizar
 * =========================================================== */

const update = async (
    user,
    asignacionId,
    payload
) => {

    const userId =
        getUserId(user);

    return sequelize.transaction(

        async (
            transaction
        ) => {

            const asignacion =
                await findAccessibleAsignacion(

                    user,

                    asignacionId,

                    {

                        includeDetail:
                            false,

                    }

                );

            const cambios = {

                modificado_por:
                    userId,

            };

            if (
                payload.estado
            ) {

                cambios.estado =
                    normalizeState(
                        payload.estado
                    );

            }

            if (
                payload.registro_actual_id !==
                undefined
            ) {

                cambios.registro_actual_id =
                    payload.registro_actual_id ||
                    null;

            }

            if (
                payload.activo !==
                undefined
            ) {

                cambios.activo =
                    parseBoolean(
                        payload.activo,
                        true
                    );

            }

            await asignacion.update(

                cambios,

                {

                    transaction,

                }

            );

            return findAccessibleAsignacion(

                user,

                asignacion.id,

                {

                    includeDetail:
                        true,

                }

            );

        }

    );

};

/* ===========================================================
 * Eliminar
 * =========================================================== */

const remove = async (
    user,
    asignacionId
) => {

    const userId =
        getUserId(user);

    const asignacion =
        await findAccessibleAsignacion(

            user,

            asignacionId

        );

    await asignacion.update({

        activo:
            false,

        modificado_por:
            userId,

    });

    await asignacion.destroy();

    return {

        id:
            asignacion.id,

        activo:
            false,

    };

};

/* ===========================================================
 * Export
 * =========================================================== */

export default {

    getAll,

    getById,

    create,

    update,

    remove,

    getByEntidad

};