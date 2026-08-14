import InteligenciaEvento
    from "../../models/inteligencia/inteligenciaEventoModel.js";

import {
    crearEvento,
} from "./inteligenciaEventoService.js";

import { Op } from "sequelize";


import VentaArticulo
    from "../../models/rinde/ventaArticuloModel.js";

import {
    obtenerFeriadosArgentina,
} from "../../config/feriadosArgentina.js";
/*
|--------------------------------------------------------------------------
| CONFIGURACIÓN
|--------------------------------------------------------------------------
*/

const CATEGORIA_CALENDARIO =
    "CALENDARIO";

const TIPO_FERIADO =
    "FERIADO";


/*
|--------------------------------------------------------------------------
| NORMALIZAR FECHA
|--------------------------------------------------------------------------
*/

const normalizarFecha = (
    fecha
) => {

    if (!fecha) {
        throw new Error(
            "La fecha del feriado es obligatoria"
        );
    }


    /*
    | Aceptamos:
    |
    | YYYY-MM-DD
    |
    | y objetos Date.
    */

    if (fecha instanceof Date) {

        if (
            Number.isNaN(
                fecha.getTime()
            )
        ) {
            throw new Error(
                "Fecha de feriado inválida"
            );
        }


        return fecha
            .toISOString()
            .slice(0, 10);

    }


    const valor =
        String(fecha)
            .trim()
            .slice(0, 10);


    if (
        !/^\d{4}-\d{2}-\d{2}$/
            .test(valor)
    ) {

        throw new Error(
            `Fecha de feriado inválida: ${fecha}`
        );

    }


    return valor;

};


/*
|--------------------------------------------------------------------------
| NORMALIZAR FERIADO
|--------------------------------------------------------------------------
|
| El service trabaja internamente con este formato:
|
| {
|   fecha: "2026-08-17",
|   nombre: "...",
|   ambito: "NACIONAL"
| }
|
|--------------------------------------------------------------------------
*/

const normalizarFeriado = (
    feriado
) => {

    if (!feriado) {

        throw new Error(
            "El feriado es obligatorio"
        );

    }


    const fecha =
        normalizarFecha(
            feriado.fecha
        );


    const nombre =
        String(
            feriado.nombre || ""
        ).trim();


    if (!nombre) {

        throw new Error(
            `El feriado ${fecha} no posee nombre`
        );

    }


    return {

        fecha,

        nombre,

        ambito:
            feriado.ambito ||
            "NACIONAL",

        tipo_feriado:
            feriado.tipo_feriado ||
            "NACIONAL",

    };

};


/*
|--------------------------------------------------------------------------
| BUSCAR FERIADO EXISTENTE
|--------------------------------------------------------------------------
|
| No usamos solamente el nombre porque podría cambiar ligeramente
| según la fuente.
|
| Para nuestro histórico:
|
| categoría + tipo + fecha
|
| identifica suficientemente el feriado nacional.
|--------------------------------------------------------------------------
*/

const buscarFeriadoExistente =
    async ({
        fecha,
    }) => {

        return await InteligenciaEvento.findOne({

            where: {

                categoria:
                    CATEGORIA_CALENDARIO,

                tipo:
                    TIPO_FERIADO,

                fecha_desde:
                    fecha,

            },

        });

    };


/*
|--------------------------------------------------------------------------
| GUARDAR UN FERIADO
|--------------------------------------------------------------------------
*/

export const guardarFeriado =
    async ({
        fecha,
        nombre,
        ambito = "NACIONAL",
        tipo_feriado = "NACIONAL",

        automatico = true,

        fuente =
        "CALENDARIO_FERIADOS",

    }) => {

        const feriado =
            normalizarFeriado({
                fecha,
                nombre,
                ambito,
                tipo_feriado,
            });


        /*
        |--------------------------------------------------------------------------
        | VERIFICAR SI YA EXISTE
        |--------------------------------------------------------------------------
        */

        const existente =
            await buscarFeriadoExistente({
                fecha:
                    feriado.fecha,
            });


        if (existente) {

            return {

                creado:
                    false,

                omitido:
                    true,

                motivo:
                    "YA_EXISTE",

                evento_id:
                    existente.id,

                fecha:
                    existente.fecha_desde,

                nombre:
                    existente.nombre,

            };

        }


        /*
        |--------------------------------------------------------------------------
        | CREAR COMO INTELIGENCIA EVENTO
        |--------------------------------------------------------------------------
        */

        const evento =
            await crearEvento({

                categoria:
                    CATEGORIA_CALENDARIO,

                tipo:
                    TIPO_FERIADO,

                nombre:
                    feriado.nombre,

                fecha_desde:
                    feriado.fecha,

                fecha_hasta:
                    feriado.fecha,

                datos: {

                    ambito:
                        feriado.ambito,

                    /*
                    | Por defecto asumimos que el feriado
                    | se respeta y la empresa NO trabaja.
                    |
                    | El usuario podrá modificarlo si la
                    | empresa decide trabajar ese día.
                    */

                    empresa_trabaja:
                        false,

                    automatico,

                    fuente,

                    tipo_feriado:
                        feriado.tipo_feriado,

                },

                /*
                | [] = alcance general.
                */

                sucursales_ids:
                    [],

                articulos_ids:
                    [],

                usuario_id:
                    null,

            });


        return {

            creado:
                true,

            omitido:
                false,

            evento_id:
                evento.id,

            fecha:
                evento.fecha_desde,

            nombre:
                evento.nombre,

        };

    };


/*
|--------------------------------------------------------------------------
| SINCRONIZAR LISTA DE FERIADOS
|--------------------------------------------------------------------------
|
| Esta función NO sabe todavía de dónde vienen.
|
| Puede recibir:
|
| - API
| - archivo
| - listado oficial
| - importación manual
|
|--------------------------------------------------------------------------
*/

export const sincronizarFeriados =
    async ({
        feriados,
        fuente =
        "CALENDARIO_FERIADOS",
    }) => {

        if (!Array.isArray(feriados)) {

            throw new Error(
                "feriados debe ser un array"
            );

        }


        let creados = 0;
        let omitidos = 0;

        const resultados = [];


        for (
            const feriadoOriginal
            of feriados
        ) {

            const feriado =
                normalizarFeriado(
                    feriadoOriginal
                );


            const resultado =
                await guardarFeriado({

                    ...feriado,

                    automatico:
                        true,

                    fuente,

                });


            if (resultado.creado) {
                creados++;
            }
            else {
                omitidos++;
            }


            resultados.push(
                resultado
            );

        }


        return {

            recibidos:
                feriados.length,

            creados,

            omitidos,

            fuente,

            resultados,

        };

    };


/*
|--------------------------------------------------------------------------
| LISTAR FERIADOS DE UN AÑO
|--------------------------------------------------------------------------
*/

export const listarFeriadosAnio =
    async (
        anio
    ) => {

        const anioNumero =
            Number(anio);


        if (
            !Number.isInteger(anioNumero) ||
            anioNumero < 2000 ||
            anioNumero > 2100
        ) {

            throw new Error(
                "El año indicado no es válido"
            );

        }


        const fechaDesde =
            `${anioNumero}-01-01`;

        const fechaHasta =
            `${anioNumero}-12-31`;

        return await InteligenciaEvento.findAll({

            where: {

                categoria:
                    CATEGORIA_CALENDARIO,

                tipo:
                    TIPO_FERIADO,

                fecha_desde: {
                    [Op.between]: [
                        fechaDesde,
                        fechaHasta,
                    ],
                },

                activo:
                    true,

            },

            order: [
                ["fecha_desde", "ASC"],
            ],

        });

    };

/*
|--------------------------------------------------------------------------
| OBTENER PRIMER AÑO CON VENTAS
|--------------------------------------------------------------------------
*/

export const obtenerPrimerAnioVentas =
    async () => {

        const primeraFecha =
            await VentaArticulo.min(
                "fecha"
            );


        if (!primeraFecha) {

            throw new Error(
                "No existen ventas históricas para determinar el primer año"
            );

        }


        const fecha =
            String(
                primeraFecha
            ).slice(0, 10);


        return Number(
            fecha.slice(0, 4)
        );

    };


/*
|--------------------------------------------------------------------------
| AÑO ACTUAL ARGENTINA
|--------------------------------------------------------------------------
*/

const obtenerAnioArgentina =
    () => {

        return Number(
            new Intl.DateTimeFormat(
                "en",
                {
                    timeZone:
                        "America/Argentina/Catamarca",

                    year:
                        "numeric",
                }
            ).format(
                new Date()
            )
        );

    };


/*
|--------------------------------------------------------------------------
| SINCRONIZAR AÑO
|--------------------------------------------------------------------------
*/

export const sincronizarFeriadosAnio =
    async (
        anio
    ) => {

        const anioNumero =
            Number(anio);


        const feriados =
            obtenerFeriadosArgentina(
                anioNumero
            );


        if (!feriados) {

            return {

                anio:
                    anioNumero,

                disponible:
                    false,

                creados:
                    0,

                omitidos:
                    0,

                mensaje:
                    `No existe calendario configurado para ${anioNumero}`,

            };

        }


        const resultado =
            await sincronizarFeriados({

                feriados,

                fuente:
                    `CALENDARIO_ARGENTINA_${anioNumero}`,

            });


        return {

            anio:
                anioNumero,

            disponible:
                true,

            ...resultado,

        };

    };


/*
|--------------------------------------------------------------------------
| SINCRONIZAR CALENDARIO HISTÓRICO
|--------------------------------------------------------------------------
|
| Primera venta
|      ↓
| obtener año
|      ↓
| año inicial → año actual
|      ↓
| importar todos los calendarios disponibles
|--------------------------------------------------------------------------
*/

export const sincronizarCalendarioHistorico =
    async () => {

        const anioDesde =
            await obtenerPrimerAnioVentas();


        const anioHasta =
            obtenerAnioArgentina();


        const resultados = [];

        let creados = 0;
        let omitidos = 0;
        let aniosNoDisponibles = 0;


        for (
            let anio = anioDesde;
            anio <= anioHasta;
            anio++
        ) {

            const resultado =
                await sincronizarFeriadosAnio(
                    anio
                );


            resultados.push(
                resultado
            );


            if (
                !resultado.disponible
            ) {

                aniosNoDisponibles++;

                continue;

            }


            creados +=
                resultado.creados || 0;

            omitidos +=
                resultado.omitidos || 0;

        }


        return {

            anio_desde:
                anioDesde,

            anio_hasta:
                anioHasta,

            creados,

            omitidos,

            anios_no_disponibles:
                aniosNoDisponibles,

            resultados,

        };

    };