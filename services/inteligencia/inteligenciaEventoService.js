import { Op } from "sequelize";

import { sequelize }
    from "../../config/database.js";

import InteligenciaEvento
    from "../../models/inteligencia/inteligenciaEventoModel.js";

import InteligenciaEventoSucursal
    from "../../models/inteligencia/inteligenciaEventoSucursalModel.js";

import InteligenciaEventoArticulo
    from "../../models/inteligencia/inteligenciaEventoArticuloModel.js";

// import {
//     validarDatosEvento,
// } from "../../config/inteligenciaEventos.js";

import {
    INTELIGENCIA_EVENTOS,
    validarDatosEvento,
} from "../../config/inteligenciaEventos.js";

import Sucursal
    from "../../models/gmedias/sucursalModel.js";

import ArticuloTabla
    from "../../models/tablas/articuloModel.js";

/*
|--------------------------------------------------------------------------
| CREAR EVENTO
|--------------------------------------------------------------------------
*/

export const crearEvento = async ({
    categoria,
    tipo,
    nombre,
    fecha_desde,
    fecha_hasta = null,

    datos = {},
    observaciones = null,

    sucursales_ids = [],
    articulos_ids = [],

    usuario_id = null,
}) => {

    if (!categoria) {
        throw new Error(
            "La categoría es obligatoria"
        );
    }

    if (!tipo) {
        throw new Error(
            "El tipo de evento es obligatorio"
        );
    }

    if (!nombre) {
        throw new Error(
            "El nombre del evento es obligatorio"
        );
    }

    if (!fecha_desde) {
        throw new Error(
            "La fecha desde es obligatoria"
        );
    }


    /*
    |--------------------------------------------------------------------------
    | NORMALIZAR ARRAYS
    |--------------------------------------------------------------------------
    */

    if (!Array.isArray(sucursales_ids)) {
        throw new Error(
            "sucursales_ids debe ser un array"
        );
    }

    if (!Array.isArray(articulos_ids)) {
        throw new Error(
            "articulos_ids debe ser un array"
        );
    }


    /*
    |--------------------------------------------------------------------------
    | FECHAS
    |--------------------------------------------------------------------------
    */

    const fechaHastaFinal =
        fecha_hasta || fecha_desde;


    if (
        new Date(fechaHastaFinal) <
        new Date(fecha_desde)
    ) {
        throw new Error(
            "La fecha hasta no puede ser anterior a la fecha desde"
        );
    }


    /*
    |--------------------------------------------------------------------------
    | VALIDAR SEGÚN CATÁLOGO
    |--------------------------------------------------------------------------
    */

    validarDatosEvento({
        categoria,
        tipo,
        datos,
        sucursales_ids,
        articulos_ids,
    });


    /*
    |--------------------------------------------------------------------------
    | QUITAR DUPLICADOS
    |--------------------------------------------------------------------------
    */

    const sucursalesIdsFinal =
        [
            ...new Set(
                sucursales_ids.map(Number)
            ),
        ];


    const articulosIdsFinal =
        [
            ...new Set(
                articulos_ids.map(Number)
            ),
        ];


    /*
    |--------------------------------------------------------------------------
    | TRANSACCIÓN
    |--------------------------------------------------------------------------
    */

    const transaction =
        await sequelize.transaction();


    try {

        const evento =
            await InteligenciaEvento.create(
                {
                    categoria,
                    tipo,
                    nombre,

                    fecha_desde,
                    fecha_hasta:
                        fechaHastaFinal,

                    datos,
                    observaciones,

                    usuario_id,
                    activo: true,
                },
                {
                    transaction,
                }
            );


        /*
        |--------------------------------------------------------------------------
        | SUCURSALES
        |--------------------------------------------------------------------------
        */

        if (sucursalesIdsFinal.length) {

            await InteligenciaEventoSucursal.bulkCreate(
                sucursalesIdsFinal.map(
                    (sucursal_id) => ({
                        evento_id: evento.id,
                        sucursal_id,
                    })
                ),
                {
                    transaction,
                }
            );

        }


        /*
        |--------------------------------------------------------------------------
        | ARTÍCULOS
        |--------------------------------------------------------------------------
        */

        if (articulosIdsFinal.length) {

            await InteligenciaEventoArticulo.bulkCreate(
                articulosIdsFinal.map(
                    (articulo_id) => ({
                        evento_id: evento.id,
                        articulo_id,
                    })
                ),
                {
                    transaction,
                }
            );

        }


        await transaction.commit();


        return await obtenerEventoPorId(
            evento.id
        );

    }
    catch (error) {

        await transaction.rollback();

        throw error;

    }

};


/*
|--------------------------------------------------------------------------
| OBTENER EVENTO
|--------------------------------------------------------------------------
*/

export const obtenerEventoPorId = async (
    id
) => {

    const evento =
        await InteligenciaEvento.findByPk(
            id,
            {
                include: [

                    {
                        model:
                            InteligenciaEventoSucursal,

                        as:
                            "sucursales_evento",

                        attributes: [
                            "id",
                            "sucursal_id",
                        ],

                        include: [
                            {
                                model: Sucursal,
                                as: "sucursal",

                                attributes: [
                                    "id",
                                    "codigo",
                                    "nombre",
                                ],

                                required: false,
                            },
                        ],

                        required: false,
                    },


                    {
                        model:
                            InteligenciaEventoArticulo,

                        as:
                            "articulos_evento",

                        attributes: [
                            "id",
                            "articulo_id",
                        ],

                        include: [
                            {
                                model:
                                    ArticuloTabla,

                                as:
                                    "articulo",

                                attributes: [
                                    "id",
                                    "codigobarra",
                                    "descripcion",
                                    "descripcionreducida",
                                ],

                                required: false,
                            },
                        ],

                        required: false,
                    },

                ],
            }
        );


    if (!evento) {

        throw new Error(
            "El evento no existe"
        );

    }


    return evento;
};


/*
|--------------------------------------------------------------------------
| LISTAR EVENTOS
|--------------------------------------------------------------------------
*/

export const listarEventos = async ({
    fecha_desde = null,
    fecha_hasta = null,
    categoria = null,
    tipo = null,
    sucursal_id = null,
    articulo_id = null,
    activo = null,
} = {}) => {

    const where = {};


    /*
    |--------------------------------------------------------------------------
    | FILTROS GENERALES
    |--------------------------------------------------------------------------
    */

    if (categoria) {
        where.categoria = categoria;
    }


    if (tipo) {
        where.tipo = tipo;
    }


    if (
        activo !== null &&
        activo !== undefined
    ) {
        where.activo = activo;
    }


    /*
    |--------------------------------------------------------------------------
    | FILTRO POR SUPERPOSICIÓN DE FECHAS
    |--------------------------------------------------------------------------
    |
    | Ejemplo:
    |
    | Evento:
    |       05/08 ---------------- 15/08
    |
    | Consulta:
    |               10/08 ---------------- 20/08
    |
    | El evento debe aparecer porque ambos períodos se superponen.
    |--------------------------------------------------------------------------
    */

    if (fecha_desde && fecha_hasta) {

        where[Op.and] = [
            {
                fecha_desde: {
                    [Op.lte]: fecha_hasta,
                },
            },
            {
                fecha_hasta: {
                    [Op.gte]: fecha_desde,
                },
            },
        ];

    }
    else if (fecha_desde) {

        where.fecha_hasta = {
            [Op.gte]: fecha_desde,
        };

    }
    else if (fecha_hasta) {

        where.fecha_desde = {
            [Op.lte]: fecha_hasta,
        };

    }


    /*
    |--------------------------------------------------------------------------
    | CONSULTA
    |--------------------------------------------------------------------------
    */

    const eventos =
        await InteligenciaEvento.findAll({

            where,

            include: [

                /*
                |--------------------------------------------------------------------------
                | SUCURSALES AFECTADAS
                |--------------------------------------------------------------------------
                */

                {
                    model:
                        InteligenciaEventoSucursal,

                    as:
                        "sucursales_evento",

                    attributes: [
                        "id",
                        "sucursal_id",
                    ],

                    include: [
                        {
                            model: Sucursal,
                            as: "sucursal",

                            attributes: [
                                "id",
                                "codigo",
                                "nombre",
                            ],

                            required: Boolean(sucursal_id),

                            where: sucursal_id
                                ? {
                                    sucursal_id,
                                }
                                : undefined,
                        },
                    ],

                    required: false,
                },


                /*
                |--------------------------------------------------------------------------
                | ARTÍCULOS AFECTADOS
                |--------------------------------------------------------------------------
                */

                {
                    model:
                        InteligenciaEventoArticulo,

                    as:
                        "articulos_evento",

                    attributes: [
                        "id",
                        "articulo_id",
                    ],

                    include: [
                        {
                            model:
                                ArticuloTabla,

                            as:
                                "articulo",

                            attributes: [
                                "id",
                                "codigobarra",
                                "descripcion",
                                "descripcionreducida",
                            ],

                            required: Boolean(articulo_id),

                            where: articulo_id
                                ? {
                                    articulo_id,
                                }
                                : undefined,
                        },
                    ],

                    required: false,
                },

            ],


            /*
            |--------------------------------------------------------------------------
            | ORDEN
            |--------------------------------------------------------------------------
            */

            order: [
                ["fecha_desde", "DESC"],
                ["id", "DESC"],
            ],

        });


    return eventos;
};
/*
|--------------------------------------------------------------------------
| ACTUALIZAR EVENTO
|--------------------------------------------------------------------------
*/

export const actualizarEvento = async (
    id,
    {
        categoria,
        tipo,
        nombre,
        fecha_desde,
        fecha_hasta,

        datos,
        observaciones,

        sucursales_ids,
        articulos_ids,

        activo,
    }
) => {

    const evento =
        await InteligenciaEvento.findByPk(id);

    if (!evento) {
        throw new Error(
            "El evento no existe"
        );
    }


    /*
    |--------------------------------------------------------------------------
    | ESTADO FINAL DEL EVENTO
    |--------------------------------------------------------------------------
    |
    | Permitimos actualización parcial.
    | Si un campo no viene, conservamos el valor existente.
    |--------------------------------------------------------------------------
    */

    const categoriaFinal =
        categoria ?? evento.categoria;

    const tipoFinal =
        tipo ?? evento.tipo;

    const nombreFinal =
        nombre ?? evento.nombre;

    const fechaDesdeFinal =
        fecha_desde ?? evento.fecha_desde;

    let fechaHastaFinal =
        fecha_hasta !== undefined
            ? fecha_hasta
            : evento.fecha_hasta;


    /*
    | Si explícitamente llega null, consideramos
    | evento de un solo día.
    */
    if (!fechaHastaFinal) {
        fechaHastaFinal =
            fechaDesdeFinal;
    }


    if (
        new Date(fechaHastaFinal) <
        new Date(fechaDesdeFinal)
    ) {
        throw new Error(
            "La fecha hasta no puede ser anterior a la fecha desde"
        );
    }


    const datosFinal =
        datos !== undefined
            ? datos
            : evento.datos || {};


    /*
    |--------------------------------------------------------------------------
    | OBTENER RELACIONES ACTUALES
    |--------------------------------------------------------------------------
    */

    const sucursalesActuales =
        await InteligenciaEventoSucursal.findAll({
            where: {
                evento_id: id,
            },
            attributes: ["sucursal_id"],
            raw: true,
        });


    const articulosActuales =
        await InteligenciaEventoArticulo.findAll({
            where: {
                evento_id: id,
            },
            attributes: ["articulo_id"],
            raw: true,
        });


    /*
    | Si los arrays NO vienen en el request,
    | conservamos los actuales.
    |
    | Si vienen [] significa GLOBAL / TODOS.
    */

    const sucursalesIdsFinal =
        sucursales_ids !== undefined
            ? sucursales_ids
            : sucursalesActuales.map(
                (item) => item.sucursal_id
            );


    const articulosIdsFinal =
        articulos_ids !== undefined
            ? articulos_ids
            : articulosActuales.map(
                (item) => item.articulo_id
            );


    if (!Array.isArray(sucursalesIdsFinal)) {
        throw new Error(
            "sucursales_ids debe ser un array"
        );
    }


    if (!Array.isArray(articulosIdsFinal)) {
        throw new Error(
            "articulos_ids debe ser un array"
        );
    }


    /*
    |--------------------------------------------------------------------------
    | VALIDACIÓN CONTRA CATÁLOGO
    |--------------------------------------------------------------------------
    */

    validarDatosEvento({
        categoria: categoriaFinal,
        tipo: tipoFinal,
        datos: datosFinal,
        sucursales_ids: sucursalesIdsFinal,
        articulos_ids: articulosIdsFinal,
    });


    /*
    |--------------------------------------------------------------------------
    | NORMALIZAR / QUITAR DUPLICADOS
    |--------------------------------------------------------------------------
    */

    const sucursalesNormalizadas = [
        ...new Set(
            sucursalesIdsFinal.map(Number)
        ),
    ];


    const articulosNormalizados = [
        ...new Set(
            articulosIdsFinal.map(Number)
        ),
    ];


    const transaction =
        await sequelize.transaction();


    try {

        /*
        |--------------------------------------------------------------------------
        | ACTUALIZAR CABECERA
        |--------------------------------------------------------------------------
        */

        await evento.update(
            {
                categoria: categoriaFinal,
                tipo: tipoFinal,
                nombre: nombreFinal,

                fecha_desde:
                    fechaDesdeFinal,

                fecha_hasta:
                    fechaHastaFinal,

                datos:
                    datosFinal,

                observaciones:
                    observaciones !== undefined
                        ? observaciones
                        : evento.observaciones,

                activo:
                    activo !== undefined
                        ? activo
                        : evento.activo,
            },
            {
                transaction,
            }
        );


        /*
        |--------------------------------------------------------------------------
        | REEMPLAZAR SUCURSALES
        |--------------------------------------------------------------------------
        */

        await InteligenciaEventoSucursal.destroy({
            where: {
                evento_id: id,
            },
            transaction,
        });


        if (sucursalesNormalizadas.length) {

            await InteligenciaEventoSucursal.bulkCreate(
                sucursalesNormalizadas.map(
                    (sucursal_id) => ({
                        evento_id: id,
                        sucursal_id,
                    })
                ),
                {
                    transaction,
                }
            );

        }


        /*
        |--------------------------------------------------------------------------
        | REEMPLAZAR ARTÍCULOS
        |--------------------------------------------------------------------------
        */

        await InteligenciaEventoArticulo.destroy({
            where: {
                evento_id: id,
            },
            transaction,
        });


        if (articulosNormalizados.length) {

            await InteligenciaEventoArticulo.bulkCreate(
                articulosNormalizados.map(
                    (articulo_id) => ({
                        evento_id: id,
                        articulo_id,
                    })
                ),
                {
                    transaction,
                }
            );

        }


        await transaction.commit();


        return await obtenerEventoPorId(id);

    }
    catch (error) {

        await transaction.rollback();

        throw error;

    }

};

/*
|--------------------------------------------------------------------------
| ELIMINAR EVENTO
|--------------------------------------------------------------------------
*/

export const eliminarEvento = async (
    id
) => {

    const transaction =
        await sequelize.transaction();


    try {

        const evento =
            await InteligenciaEvento.findByPk(
                id,
                {
                    transaction,
                }
            );


        if (!evento) {
            throw new Error(
                "El evento no existe"
            );
        }


        /*
        |--------------------------------------------------------------------------
        | ELIMINAR RELACIONES
        |--------------------------------------------------------------------------
        |
        | Aunque tenemos onDelete CASCADE en los modelos,
        | lo hacemos explícitamente para no depender de cómo
        | haya quedado creada la FK en PostgreSQL.
        |--------------------------------------------------------------------------
        */

        await InteligenciaEventoSucursal.destroy({
            where: {
                evento_id: id,
            },
            transaction,
        });


        await InteligenciaEventoArticulo.destroy({
            where: {
                evento_id: id,
            },
            transaction,
        });


        await evento.destroy({
            transaction,
        });


        await transaction.commit();


        return {
            id: evento.id,
            nombre: evento.nombre,
        };

    }
    catch (error) {

        await transaction.rollback();

        throw error;

    }

};

/*
|--------------------------------------------------------------------------
| OBTENER CATÁLOGO
|--------------------------------------------------------------------------
*/

export const obtenerCatalogoEventos = () => {

    return Object.entries(
        INTELIGENCIA_EVENTOS
    ).map(
        ([categoria, tipos]) => ({

            categoria,

            tipos:
                Object.entries(tipos).map(
                    ([tipo, configuracion]) => ({
                        tipo,
                        ...configuracion,
                    })
                ),

        })
    );

};