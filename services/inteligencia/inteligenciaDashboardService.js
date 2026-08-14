import { Op, fn, col } from "sequelize";

import VentaTotal
    from "../../models/rinde/ventaTotalModel.js";

import VentaArticulo
    from "../../models/rinde/ventaArticuloModel.js";

import InteligenciaSnapshot
    from "../../models/inteligencia/inteligenciaSnapshotModel.js";

import InteligenciaPrecioHistorico
    from "../../models/inteligencia/inteligenciaPrecioHistoricoModel.js";

import InteligenciaPromocionHistorico
    from "../../models/inteligencia/inteligenciaPromocionHistoricoModel.js";

import InteligenciaEvento
    from "../../models/inteligencia/inteligenciaEventoModel.js";

import InteligenciaClima
    from "../../models/inteligencia/inteligenciaClimaModel.js";


/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

const fechaHoy = () => {

    const ahora =
        new Date();

    const year =
        ahora.getFullYear();

    const month =
        String(
            ahora.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            ahora.getDate()
        ).padStart(2, "0");

    return `${year}-${month}-${day}`;
};


const diasEntre = (
    fechaDesde,
    fechaHasta
) => {

    if (
        !fechaDesde ||
        !fechaHasta
    ) {
        return null;
    }

    const desde =
        new Date(
            `${fechaDesde}T00:00:00`
        );

    const hasta =
        new Date(
            `${fechaHasta}T00:00:00`
        );

    if (
        Number.isNaN(desde.getTime()) ||
        Number.isNaN(hasta.getTime())
    ) {
        return null;
    }

    return Math.floor(
        (
            hasta.getTime() -
            desde.getTime()
        ) /
        86400000
    );
};


/*
|--------------------------------------------------------------------------
| ESTADO SEGÚN ANTIGÜEDAD
|--------------------------------------------------------------------------
*/

const calcularEstado = ({
    ultimaFecha,
    hoy,
    toleranciaDias = 1,
}) => {

    if (!ultimaFecha) {

        return {
            estado: "SIN_DATOS",
            dias_desde_ultimo_dato: null,
        };

    }

    const dias =
        diasEntre(
            ultimaFecha,
            hoy
        );

    if (
        dias === null
    ) {

        return {
            estado: "DESCONOCIDO",
            dias_desde_ultimo_dato: null,
        };

    }

    return {

        estado:
            dias <= toleranciaDias
                ? "OK"
                : "DESACTUALIZADO",

        dias_desde_ultimo_dato:
            dias,

    };
};


/*
|--------------------------------------------------------------------------
| VENTAS
|--------------------------------------------------------------------------
*/

const obtenerEstadoVentas =
    async (hoy) => {

        const ultimaFecha =
            await VentaTotal.max(
                "fecha"
            );

        const cantidadRegistros =
            await VentaTotal.count();

        let sucursalesConDatos = 0;


        if (ultimaFecha) {

            sucursalesConDatos =
                await VentaTotal.count({
                    distinct: true,
                    col: "sucursal_id",

                    where: {
                        fecha:
                            ultimaFecha,
                    },
                });

        }


        const estado =
            calcularEstado({
                ultimaFecha,
                hoy,
                toleranciaDias: 1,
            });


        return {

            ultima_fecha:
                ultimaFecha ||
                null,

            registros:
                cantidadRegistros,

            sucursales_ultima_fecha:
                sucursalesConDatos,

            ...estado,

        };

    };


/*
|--------------------------------------------------------------------------
| VENTAS POR ARTÍCULO
|--------------------------------------------------------------------------
*/

const obtenerEstadoVentaArticulos =
    async (hoy) => {

        const ultimaFecha =
            await VentaArticulo.max(
                "fecha"
            );

        const cantidadRegistros =
            await VentaArticulo.count();

        let articulos = 0;

        let sucursales = 0;


        if (ultimaFecha) {

            /*
            | VentaArticulo no posee articulo_id.
            |
            | Por lo que usamos articuloCodigo,
            | que es el identificador disponible
            | en el histórico de ventas.
            */

            articulos =
                await VentaArticulo.count({
                    distinct: true,
                    col: "articuloCodigo",

                    where: {
                        fecha:
                            ultimaFecha,
                    },
                });


            sucursales =
                await VentaArticulo.count({
                    distinct: true,
                    col: "sucursal_id",

                    where: {
                        fecha:
                            ultimaFecha,
                    },
                });

        }


        const estado =
            calcularEstado({
                ultimaFecha,
                hoy,
                toleranciaDias: 1,
            });


        return {

            ultima_fecha:
                ultimaFecha ||
                null,

            registros:
                cantidadRegistros,

            articulos_ultima_fecha:
                articulos,

            sucursales_ultima_fecha:
                sucursales,

            ...estado,

        };

    };


/*
|--------------------------------------------------------------------------
| SNAPSHOTS
|--------------------------------------------------------------------------
*/

const obtenerEstadoSnapshots =
    async (hoy) => {

        const ultimoSnapshot =
            await InteligenciaSnapshot.findOne({

                order: [
                    ["fecha", "DESC"],
                    ["id", "DESC"],
                ],

                raw: true,

            });


        if (!ultimoSnapshot) {

            return {

                ultima_fecha:
                    null,

                snapshot_id:
                    null,

                precios:
                    0,

                promociones:
                    0,

                estado:
                    "SIN_DATOS",

                dias_desde_ultimo_dato:
                    null,

            };

        }


        const [
            precios,
            promociones,
        ] =
            await Promise.all([

                InteligenciaPrecioHistorico.count({
                    where: {
                        snapshot_id:
                            ultimoSnapshot.id,
                    },
                }),

                InteligenciaPromocionHistorico.count({
                    where: {
                        snapshot_id:
                            ultimoSnapshot.id,
                    },
                }),

            ]);


        /*
        | Los snapshots son manuales.
        |
        | No los consideramos vencidos después
        | de solamente un día.
        |
        | Inicialmente usamos 7 días como alerta.
        | Esto después puede transformarse en
        | configuración del sistema.
        */

        const estado =
            calcularEstado({
                ultimaFecha:
                    ultimoSnapshot.fecha,

                hoy,

                toleranciaDias:
                    7,
            });


        return {

            ultima_fecha:
                ultimoSnapshot.fecha,

            snapshot_id:
                ultimoSnapshot.id,

            precios,

            promociones,

            ...estado,

        };

    };


/*
|--------------------------------------------------------------------------
| CLIMA
|--------------------------------------------------------------------------
*/

const obtenerEstadoClima =
    async (hoy) => {

        const ultimo =
            await InteligenciaClima.findOne({

                order: [
                    ["fecha", "DESC"],
                ],

                raw: true,

            });


        if (!ultimo) {

            return {

                ultima_fecha:
                    null,

                registro:
                    null,

                estado:
                    "SIN_DATOS",

                dias_desde_ultimo_dato:
                    null,

            };

        }


        const estado =
            calcularEstado({
                ultimaFecha:
                    ultimo.fecha,

                hoy,

                toleranciaDias:
                    1,
            });


        return {

            ultima_fecha:
                ultimo.fecha,

            registro: {

                id:
                    ultimo.id,

                temperatura_min:
                    ultimo.temperatura_min,

                temperatura_max:
                    ultimo.temperatura_max,

                temperatura_media:
                    ultimo.temperatura_media,

                precipitacion_mm:
                    ultimo.precipitacion_mm,

                viento_max_kmh:
                    ultimo.viento_max_kmh,

                codigo_clima:
                    ultimo.codigo_clima,

                fuente:
                    ultimo.fuente,

            },

            ...estado,

        };

    };


/*
|--------------------------------------------------------------------------
| EVENTOS
|--------------------------------------------------------------------------
*/

const obtenerEstadoEventos =
    async (hoy) => {

        const total =
            await InteligenciaEvento.count({
                where: {
                    activo: true,
                },
            });


        const ultimoEvento =
            await InteligenciaEvento.findOne({

                where: {
                    activo: true,
                },

                order: [
                    ["createdAt", "DESC"],
                ],

                attributes: [
                    "id",
                    "fecha_desde",
                    "createdAt",
                ],

                raw: true,

            });


        /*
        |--------------------------------------------------------------------------
        | CANTIDAD POR CATEGORÍA
        |--------------------------------------------------------------------------
        */

        const porCategoriaRaw =
            await InteligenciaEvento.findAll({

                where: {
                    activo: true,
                },

                attributes: [

                    "categoria",

                    [
                        fn(
                            "COUNT",
                            col("id")
                        ),
                        "cantidad",
                    ],

                ],

                group: [
                    "categoria",
                ],

                raw: true,

            });


        const porCategoria = {};


        for (
            const item
            of porCategoriaRaw
        ) {

            porCategoria[
                item.categoria
            ] =
                Number(
                    item.cantidad
                );

        }


        /*
        |--------------------------------------------------------------------------
        | CANTIDAD POR TIPO
        |--------------------------------------------------------------------------
        */

        const porTipoRaw =
            await InteligenciaEvento.findAll({

                where: {
                    activo: true,
                },

                attributes: [

                    "tipo",

                    [
                        fn(
                            "COUNT",
                            col("id")
                        ),
                        "cantidad",
                    ],

                ],

                group: [
                    "tipo",
                ],

                raw: true,

            });


        const porTipo = {};


        for (
            const item
            of porTipoRaw
        ) {

            porTipo[
                item.tipo
            ] =
                Number(
                    item.cantidad
                );

        }


        return {

            total,

            ultimo_registro:
                ultimoEvento?.createdAt ||
                null,

            por_categoria:
                porCategoria,

            por_tipo:
                porTipo,

        };

    };


/*
|--------------------------------------------------------------------------
| PRÓXIMOS EVENTOS
|--------------------------------------------------------------------------
*/

const obtenerProximosEventos =
    async (hoy) => {

        return await InteligenciaEvento.findAll({

            where: {

                activo:
                    true,

                fecha_desde: {
                    [Op.gte]:
                        hoy,
                },

            },

            attributes: [
                "id",
                "categoria",
                "tipo",
                "nombre",
                "fecha_desde",
                "fecha_hasta",
                "datos",
                "observaciones",
            ],

            order: [
                ["fecha_desde", "ASC"],
                ["id", "ASC"],
            ],

            limit:
                10,

            raw:
                true,

        });

    };


/*
|--------------------------------------------------------------------------
| EVENTOS ACTIVOS HOY
|--------------------------------------------------------------------------
*/

const obtenerEventosHoy =
    async (hoy) => {

        /*
        | Un evento afecta hoy cuando:
        |
        | fecha_desde <= hoy
        |
        | y:
        |
        | fecha_hasta >= hoy
        | o fecha_hasta es NULL.
        */

        return await InteligenciaEvento.findAll({

            where: {

                activo:
                    true,

                fecha_desde: {
                    [Op.lte]:
                        hoy,
                },

                [Op.or]: [

                    {
                        fecha_hasta: {
                            [Op.gte]:
                                hoy,
                        },
                    },

                    {
                        fecha_hasta:
                            null,
                    },

                ],

            },

            attributes: [
                "id",
                "categoria",
                "tipo",
                "nombre",
                "fecha_desde",
                "fecha_hasta",
                "datos",
            ],

            order: [
                ["categoria", "ASC"],
                ["tipo", "ASC"],
                ["id", "ASC"],
            ],

            raw:
                true,

        });

    };


/*
|--------------------------------------------------------------------------
| RESUMEN GENERAL
|--------------------------------------------------------------------------
*/

export const obtenerDashboardInteligencia =
    async () => {

        const hoy =
            fechaHoy();


        /*
        | Ejecutamos las consultas independientes
        | en paralelo.
        */

        const [
            ventas,
            ventasArticulos,
            snapshots,
            clima,
            eventos,
            proximosEventos,
            eventosHoy,
        ] =
            await Promise.all([

                obtenerEstadoVentas(
                    hoy
                ),

                obtenerEstadoVentaArticulos(
                    hoy
                ),

                obtenerEstadoSnapshots(
                    hoy
                ),

                obtenerEstadoClima(
                    hoy
                ),

                obtenerEstadoEventos(
                    hoy
                ),

                obtenerProximosEventos(
                    hoy
                ),

                obtenerEventosHoy(
                    hoy
                ),

            ]);


        /*
        |--------------------------------------------------------------------------
        | ESTADO GENERAL
        |--------------------------------------------------------------------------
        */

        const fuentesCriticas = [
            ventas,
            ventasArticulos,
            clima,
        ];


        let estadoGeneral =
            "OK";


        if (
            fuentesCriticas.some(
                (item) =>
                    item.estado ===
                    "SIN_DATOS"
            )
        ) {

            estadoGeneral =
                "INCOMPLETO";

        }
        else if (
            fuentesCriticas.some(
                (item) =>
                    item.estado ===
                    "DESACTUALIZADO"
            ) ||
            snapshots.estado ===
                "DESACTUALIZADO" ||
            snapshots.estado ===
                "SIN_DATOS"
        ) {

            estadoGeneral =
                "ATENCION";

        }


        return {

            fecha:
                hoy,

            estado_general:
                estadoGeneral,

            fuentes: {

                ventas,

                ventas_articulos:
                    ventasArticulos,

                snapshots,

                clima,

                eventos,

            },

            eventos_hoy:
                eventosHoy,

            proximos_eventos:
                proximosEventos,

        };

    };


export default {
    obtenerDashboardInteligencia,
};