import { Op } from "sequelize";

import InteligenciaClima
    from "../../models/inteligencia/inteligenciaClimaModel.js";

import VentaArticulo
    from "../../models/rinde/ventaArticuloModel.js";

const OPEN_METEO_ARCHIVE_URL =
    "https://archive-api.open-meteo.com/v1/archive";


/*
|--------------------------------------------------------------------------
| CONFIGURACIÓN
|--------------------------------------------------------------------------
*/

const obtenerConfiguracionClima = () => {

    const latitude =
        Number(
            process.env.INTELIGENCIA_CLIMA_LAT
        );

    const longitude =
        Number(
            process.env.INTELIGENCIA_CLIMA_LON
        );

    const timezone =
        process.env.INTELIGENCIA_CLIMA_TIMEZONE ||
        "America/Argentina/Catamarca";


    if (
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude)
    ) {

        throw new Error(
            "No están configuradas correctamente las coordenadas para Inteligencia Comercial"
        );

    }


    return {
        latitude,
        longitude,
        timezone,
    };

};


/*
|--------------------------------------------------------------------------
| VALIDAR FECHA
|--------------------------------------------------------------------------
*/

const validarFecha = (
    fecha,
    nombreCampo
) => {

    if (!fecha) {
        throw new Error(
            `${nombreCampo} es obligatoria`
        );
    }


    /*
    | DATEONLY / Open-Meteo:
    | YYYY-MM-DD
    */

    const regex =
        /^\d{4}-\d{2}-\d{2}$/;


    if (!regex.test(fecha)) {
        throw new Error(
            `${nombreCampo} debe tener formato YYYY-MM-DD`
        );
    }


    const fechaDate =
        new Date(`${fecha}T00:00:00Z`);


    if (
        Number.isNaN(
            fechaDate.getTime()
        )
    ) {
        throw new Error(
            `${nombreCampo} no es una fecha válida`
        );
    }

};


/*
|--------------------------------------------------------------------------
| CONSULTAR OPEN-METEO
|--------------------------------------------------------------------------
*/

export const consultarClimaHistorico = async ({
    fecha_desde,
    fecha_hasta,
}) => {

    validarFecha(
        fecha_desde,
        "fecha_desde"
    );

    validarFecha(
        fecha_hasta,
        "fecha_hasta"
    );


    if (
        fecha_hasta <
        fecha_desde
    ) {

        throw new Error(
            "fecha_hasta no puede ser anterior a fecha_desde"
        );

    }


    const {
        latitude,
        longitude,
        timezone,
    } = obtenerConfiguracionClima();


    /*
    |--------------------------------------------------------------------------
    | VARIABLES
    |--------------------------------------------------------------------------
    |
    | Open-Meteo Historical Weather API nos permite obtener
    | directamente estas agregaciones diarias.
    |--------------------------------------------------------------------------
    */

    const dailyVariables = [
        "temperature_2m_min",
        "temperature_2m_max",
        "temperature_2m_mean",
        "precipitation_sum",
        "weather_code",
        "wind_speed_10m_max",
    ].join(",");


    const params =
        new URLSearchParams({
            latitude:
                String(latitude),

            longitude:
                String(longitude),

            start_date:
                fecha_desde,

            end_date:
                fecha_hasta,

            daily:
                dailyVariables,

            timezone,

            temperature_unit:
                "celsius",

            precipitation_unit:
                "mm",

            wind_speed_unit:
                "kmh",
        });


    const url =
        `${OPEN_METEO_ARCHIVE_URL}?${params.toString()}`;


    const response =
        await fetch(url);


    if (!response.ok) {

        let detalle = null;

        try {

            const errorBody =
                await response.json();

            detalle =
                errorBody?.reason ||
                errorBody?.error ||
                null;

        }
        catch {
            // Si Open-Meteo no devuelve JSON,
            // utilizamos solamente el status.
        }


        throw new Error(
            detalle
                ? `Error Open-Meteo: ${detalle}`
                : `Error consultando Open-Meteo (${response.status})`
        );

    }


    const data =
        await response.json();


    if (
        !data ||
        !data.daily ||
        !Array.isArray(data.daily.time)
    ) {

        throw new Error(
            "Open-Meteo devolvió una respuesta climática inválida"
        );

    }


    return data;

};


/*
|--------------------------------------------------------------------------
| TRANSFORMAR RESPUESTA
|--------------------------------------------------------------------------
*/

const transformarRespuestaClima = (
    respuesta
) => {

    const daily =
        respuesta.daily;


    const registros = [];


    for (
        let i = 0;
        i < daily.time.length;
        i++
    ) {

        registros.push({

            fecha:
                daily.time[i],

            temperatura_min:
                daily.temperature_2m_min?.[i]
                ?? null,

            temperatura_max:
                daily.temperature_2m_max?.[i]
                ?? null,

            temperatura_media:
                daily.temperature_2m_mean?.[i]
                ?? null,

            precipitacion_mm:
                daily.precipitation_sum?.[i]
                ?? null,

            viento_max_kmh:
                daily.wind_speed_10m_max?.[i]
                ?? null,

            codigo_clima:
                daily.weather_code?.[i]
                ?? null,

            fuente:
                "OPEN_METEO",

        });

    }


    return registros;

};


/*
|--------------------------------------------------------------------------
| GUARDAR / ACTUALIZAR CLIMA
|--------------------------------------------------------------------------
*/

const guardarRegistrosClima = async (
    registros
) => {

    if (!registros.length) {

        return {
            procesados: 0,
        };

    }


    await InteligenciaClima.bulkCreate(
        registros,
        {
            updateOnDuplicate: [
                "temperatura_min",
                "temperatura_max",
                "temperatura_media",
                "precipitacion_mm",
                "viento_max_kmh",
                "codigo_clima",
                "fuente",
                "updatedAt",
            ],
        }
    );


    return {
        procesados:
            registros.length,
    };

};

/*
|--------------------------------------------------------------------------
| IMPORTAR HISTÓRICO
|--------------------------------------------------------------------------
*/

export const importarClimaHistorico = async ({
    fecha_desde,
    fecha_hasta,
}) => {

    /*
    |--------------------------------------------------------------------------
    | 1. CONSULTAR
    |--------------------------------------------------------------------------
    */

    const respuesta =
        await consultarClimaHistorico({
            fecha_desde,
            fecha_hasta,
        });


    /*
    |--------------------------------------------------------------------------
    | 2. TRANSFORMAR
    |--------------------------------------------------------------------------
    */

    const registros =
        transformarRespuestaClima(
            respuesta
        );


    if (!registros.length) {

        return {
            fecha_desde,
            fecha_hasta,

            recibidos: 0,
            creados: 0,
            actualizados: 0,
        };

    }


    /*
    |--------------------------------------------------------------------------
    | 3. GUARDAR
    |--------------------------------------------------------------------------
    */

    const resultado =
        await guardarRegistrosClima(
            registros
        );


    return {

        fecha_desde,
        fecha_hasta,

        procesados:
            resultado.procesados,

        fuente:
            "OPEN_METEO",

    };

};


/*
|--------------------------------------------------------------------------
| LISTAR CLIMA
|--------------------------------------------------------------------------
*/

export const listarClima = async ({
    fecha_desde = null,
    fecha_hasta = null,
} = {}) => {

    const where = {};


    if (
        fecha_desde &&
        fecha_hasta
    ) {

        where.fecha = {
            [Op.between]: [
                fecha_desde,
                fecha_hasta,
            ],
        };

    }
    else if (fecha_desde) {

        where.fecha = {
            [Op.gte]:
                fecha_desde,
        };

    }
    else if (fecha_hasta) {

        where.fecha = {
            [Op.lte]:
                fecha_hasta,
        };

    }


    return await InteligenciaClima.findAll({

        where,

        order: [
            ["fecha", "DESC"],
        ],

    });

};


/*
|--------------------------------------------------------------------------
| OBTENER CLIMA DE UNA FECHA
|--------------------------------------------------------------------------
*/

export const obtenerClimaPorFecha = async (
    fecha
) => {

    validarFecha(
        fecha,
        "fecha"
    );


    const clima =
        await InteligenciaClima.findOne({

            where: {
                fecha,
            },

        });


    if (!clima) {

        throw new Error(
            `No existe información climática para ${fecha}`
        );

    }


    return clima;

};

/*
|--------------------------------------------------------------------------
| IMPORTAR HISTÓRICO COMPLETO SEGÚN VENTAS
|--------------------------------------------------------------------------
*/

export const importarClimaDesdePrimeraVenta =
    async () => {

        /*
        |--------------------------------------------------------------------------
        | PRIMERA FECHA CON VENTAS
        |--------------------------------------------------------------------------
        */

        const fechaMinima =
            await VentaArticulo.min(
                "fecha"
            );


        if (!fechaMinima) {

            throw new Error(
                "No existen ventas históricas para determinar el período climático"
            );

        }


        /*
        |--------------------------------------------------------------------------
        | AYER
        |--------------------------------------------------------------------------
        |
        | Nunca incorporamos hoy al histórico porque el día todavía puede
        | estar incompleto.
        |--------------------------------------------------------------------------
        */

        const hoy =
            new Date();


        const ayer =
            new Date(
                hoy.getFullYear(),
                hoy.getMonth(),
                hoy.getDate() - 1
            );


        const fechaHasta =
            [
                ayer.getFullYear(),

                String(
                    ayer.getMonth() + 1
                ).padStart(2, "0"),

                String(
                    ayer.getDate()
                ).padStart(2, "0"),
            ].join("-");


        /*
        |--------------------------------------------------------------------------
        | NORMALIZAR FECHA MÍNIMA
        |--------------------------------------------------------------------------
        */

        const fechaDesde =
            fechaMinima instanceof Date
                ? fechaMinima
                    .toISOString()
                    .slice(0, 10)
                : String(fechaMinima)
                    .slice(0, 10);


        if (
            fechaDesde >
            fechaHasta
        ) {

            throw new Error(
                "La primera fecha de ventas es posterior al último día climático disponible"
            );

        }


        return await importarClimaHistorico({
            fecha_desde:
                fechaDesde,

            fecha_hasta:
                fechaHasta,
        });

    };

/*
|--------------------------------------------------------------------------
| FECHA ACTUAL EN ARGENTINA
|--------------------------------------------------------------------------
*/

const obtenerFechaArgentina = (
    desplazamientoDias = 0
) => {

    const ahora = new Date();

    const partes =
        new Intl.DateTimeFormat(
            "en-CA",
            {
                timeZone:
                    "America/Argentina/Catamarca",

                year: "numeric",
                month: "2-digit",
                day: "2-digit",
            }
        ).formatToParts(ahora);


    const valores = {};

    for (const parte of partes) {

        if (
            parte.type === "year" ||
            parte.type === "month" ||
            parte.type === "day"
        ) {

            valores[parte.type] =
                parte.value;

        }

    }


    const fechaBase =
        new Date(
            Date.UTC(
                Number(valores.year),
                Number(valores.month) - 1,
                Number(valores.day)
            )
        );


    fechaBase.setUTCDate(
        fechaBase.getUTCDate() +
        desplazamientoDias
    );


    return fechaBase
        .toISOString()
        .slice(0, 10);

};


/*
|--------------------------------------------------------------------------
| SUMAR DÍAS A YYYY-MM-DD
|--------------------------------------------------------------------------
*/

const sumarDias = (
    fecha,
    dias
) => {

    const date =
        new Date(
            `${fecha}T00:00:00Z`
        );


    date.setUTCDate(
        date.getUTCDate() + dias
    );


    return date
        .toISOString()
        .slice(0, 10);

};


/*
|--------------------------------------------------------------------------
| COMPLETAR CLIMA HASTA AYER
|--------------------------------------------------------------------------
|
| Este proceso es autorreparable.
|
| Ejemplo:
|
| Último clima guardado: 05/08
| Hoy:                  11/08
|
| Importará:
|
| 06/08
| 07/08
| 08/08
| 09/08
| 10/08
|
|--------------------------------------------------------------------------
*/

export const completarClimaHastaAyer =
    async () => {

        const fechaAyer =
            obtenerFechaArgentina(-1);


        /*
        |--------------------------------------------------------------------------
        | ÚLTIMA FECHA CLIMÁTICA ALMACENADA
        |--------------------------------------------------------------------------
        */

        const ultimaFecha =
            await InteligenciaClima.max(
                "fecha"
            );


        /*
        |--------------------------------------------------------------------------
        | SI TODAVÍA NO EXISTE HISTÓRICO
        |--------------------------------------------------------------------------
        |
        | No inventamos desde qué fecha comenzar.
        |
        | Para la primera carga utilizamos:
        |
        | importarClimaDesdePrimeraVenta()
        |
        |--------------------------------------------------------------------------
        */

        if (!ultimaFecha) {

            return {
                actualizado: false,

                requiere_historico_inicial:
                    true,

                mensaje:
                    "No existe histórico climático. Debe realizarse primero la carga histórica inicial.",
            };

        }


        const ultimaFechaNormalizada =
            ultimaFecha instanceof Date
                ? ultimaFecha
                    .toISOString()
                    .slice(0, 10)
                : String(ultimaFecha)
                    .slice(0, 10);


        /*
        |--------------------------------------------------------------------------
        | DÍA SIGUIENTE AL ÚLTIMO GUARDADO
        |--------------------------------------------------------------------------
        */

        const fechaDesde =
            sumarDias(
                ultimaFechaNormalizada,
                1
            );


        /*
        |--------------------------------------------------------------------------
        | YA ESTAMOS ACTUALIZADOS
        |--------------------------------------------------------------------------
        */

        if (
            fechaDesde >
            fechaAyer
        ) {

            return {
                actualizado: true,

                ya_estaba_actualizado:
                    true,

                ultima_fecha:
                    ultimaFechaNormalizada,

                hasta:
                    fechaAyer,

                procesados: 0,

                mensaje:
                    "El histórico climático ya se encuentra actualizado.",
            };

        }


        /*
        |--------------------------------------------------------------------------
        | IMPORTAR TODOS LOS DÍAS FALTANTES
        |--------------------------------------------------------------------------
        */

        console.log(
            `[Inteligencia Comercial] Completando clima desde ${fechaDesde} hasta ${fechaAyer}`
        );


        const resultado =
            await importarClimaHistorico({

                fecha_desde:
                    fechaDesde,

                fecha_hasta:
                    fechaAyer,

            });


        return {
            actualizado: true,

            ya_estaba_actualizado:
                false,

            fecha_desde:
                fechaDesde,

            fecha_hasta:
                fechaAyer,

            ...resultado,
        };

    };

    /*
|--------------------------------------------------------------------------
| SINCRONIZAR HISTÓRICO CLIMÁTICO
|--------------------------------------------------------------------------
|
| Este será el método general de sincronización.
|
| Primera ejecución:
|   primera VentaArticulo → ayer
|
| Ejecuciones posteriores:
|   último clima + 1 → ayer
|
|--------------------------------------------------------------------------
*/

export const sincronizarHistoricoClima =
  async () => {

    const ultimaFecha =
      await InteligenciaClima.max(
        "fecha"
      );


    /*
    |--------------------------------------------------------------------------
    | PRIMERA VEZ
    |--------------------------------------------------------------------------
    */

    if (!ultimaFecha) {

      const resultado =
        await importarClimaDesdePrimeraVenta();


      return {
        tipo:
          "CARGA_INICIAL",

        ...resultado,
      };

    }


    /*
    |--------------------------------------------------------------------------
    | ACTUALIZACIÓN / REPARACIÓN
    |--------------------------------------------------------------------------
    */

    const resultado =
      await completarClimaHastaAyer();


    return {
      tipo:
        "ACTUALIZACION",

      ...resultado,
    };

  };