import { sequelize } from "../../config/database.js";
import { Op } from "sequelize";
import ArticuloPrecioTabla from "../../models/tablas/articuloPrecioModel.js";

import PromocionTabla from "../../models/tablas/promocionModel.js";
import PromocionArticuloTabla from "../../models/tablas/promocionArticuloModel.js";
import PromocionDiaTabla from "../../models/tablas/promocionDiaModel.js";

import InteligenciaSnapshot from "../../models/inteligencia/inteligenciaSnapshotModel.js";
import InteligenciaPrecioHistorico from "../../models/inteligencia/inteligenciaPrecioHistoricoModel.js";
import InteligenciaPromocionHistorico from "../../models/inteligencia/inteligenciaPromocionHistoricoModel.js";

import ArticuloTabla
  from "../../models/tablas/articuloModel.js";


export const crearSnapshotComercial = async ({
  fecha,
  observaciones = null,
  usuario_id = null,
  omitir_si_existe = false,
}) => {

  if (!fecha) {
    throw new Error("La fecha del snapshot es obligatoria");
  }


  const transaction = await sequelize.transaction();

  try {

    /*
    |--------------------------------------------------------------------------
    | 1. Verificar que no exista snapshot para esa fecha
    |--------------------------------------------------------------------------
    */

    const snapshotExistente = await InteligenciaSnapshot.findOne({
      where: {
        fecha,
      },
      transaction,
    });


    if (snapshotExistente) {

      if (omitir_si_existe) {

        await transaction.rollback();

        return {
          snapshot_id:
            snapshotExistente.id,

          fecha:
            snapshotExistente.fecha,

          omitido: true,

          motivo:
            "YA_EXISTE",

          mensaje:
            `Ya existe una instantánea comercial para la fecha ${fecha}`,
        };

      }


      throw new Error(
        `Ya existe una instantánea comercial para la fecha ${fecha}`
      );

    }


    /*
    |--------------------------------------------------------------------------
    | 2. Crear cabecera del snapshot
    |--------------------------------------------------------------------------
    */

    const snapshot = await InteligenciaSnapshot.create(
      {
        fecha,
        observaciones,
        usuario_id,
      },
      {
        transaction,
      }
    );


    /*
    |--------------------------------------------------------------------------
    | 3. Obtener precios actuales
    |--------------------------------------------------------------------------
    */

    const preciosActuales = await ArticuloPrecioTabla.findAll({
      attributes: [
        "articulo_id",
        "precio",
      ],
      raw: true,
      transaction,
    });


    if (!preciosActuales.length) {
      throw new Error(
        "No se encontraron precios actuales para generar la instantánea"
      );
    }


    /*
    |--------------------------------------------------------------------------
    | 4. Evitar duplicados por artículo
    |--------------------------------------------------------------------------
    |
    | ArticuloPrecioTabla posee sucursal_id, pero para Inteligencia Comercial
    | el precio es global.
    |
    | Por eso almacenamos solamente un precio por artículo.
    |--------------------------------------------------------------------------
    */

    const preciosPorArticulo = new Map();


    for (const precio of preciosActuales) {

      const articuloId = String(
        precio.articulo_id
      );


      if (!preciosPorArticulo.has(articuloId)) {

        preciosPorArticulo.set(
          articuloId,
          precio
        );

        continue;
      }


      /*
      | Si aparecen dos precios distintos para el mismo artículo,
      | NO generamos un histórico ambiguo.
      */

      const existente =
        preciosPorArticulo.get(articuloId);


      if (
        Number(existente.precio) !==
        Number(precio.precio)
      ) {

        throw new Error(
          `El artículo ${precio.articulo_id} posee precios distintos entre sucursales`
        );

      }

    }


    /*
    |--------------------------------------------------------------------------
    | 5. Guardar histórico de precios
    |--------------------------------------------------------------------------
    */

    const preciosHistoricos =
      Array.from(
        preciosPorArticulo.values()
      ).map((precio) => ({
        snapshot_id: snapshot.id,
        articulo_id: precio.articulo_id,
        precio: precio.precio,
      }));


    await InteligenciaPrecioHistorico.bulkCreate(
      preciosHistoricos,
      {
        transaction,
      }
    );


    /*
    |--------------------------------------------------------------------------
    | 6. Obtener promociones actuales
    |--------------------------------------------------------------------------
    */

    /*
    |--------------------------------------------------------------------------
    | 6. Obtener promociones vigentes para la fecha del snapshot
    |--------------------------------------------------------------------------
    */

    const promociones =
      await PromocionTabla.findAll({
        where: {
          activa: true,

          fecha_desde: {
            [Op.lte]: fecha,
          },

          fecha_hasta: {
            [Op.gte]: fecha,
          },
        },

        transaction,
      });

    /*
    |--------------------------------------------------------------------------
    | 7. Obtener detalle completo de cada promoción
    |--------------------------------------------------------------------------
    */

    const promocionesHistoricas = [];


    for (const promocion of promociones) {

      const articulos =
        await PromocionArticuloTabla.findAll({
          where: {
            promocion_id: promocion.id,
          },
          attributes: [
            "articulo_id",
            "valor",
          ],
          raw: true,
          transaction,
        });


      const dias =
        await PromocionDiaTabla.findAll({
          where: {
            promocion_id: promocion.id,
          },
          attributes: [
            "dia_semana",
          ],
          raw: true,
          transaction,
        });


      promocionesHistoricas.push({
        snapshot_id: snapshot.id,

        /*
        | Conservamos el ID original solamente
        | como referencia/auditoría.
        */
        promocion_origen_id: promocion.id,

        descripcion: promocion.descripcion,

        tipo_promocion:
          promocion.tipo_promocion,

        fecha_desde:
          promocion.fecha_desde,

        fecha_hasta:
          promocion.fecha_hasta,

        aplica_todos:
          promocion.aplica_todos,

        prioridad:
          promocion.prioridad,

        /*
        | JSONB
        */
        articulos: articulos.map(
          (articulo) => ({
            articulo_id:
              articulo.articulo_id,

            valor:
              articulo.valor,
          })
        ),

        /*
        | Ejemplo:
        | [4, 5]
        | jueves y viernes
        */
        dias_semana: dias.map(
          (dia) =>
            dia.dia_semana
        ),
      });

    }


    /*
    |--------------------------------------------------------------------------
    | 8. Guardar promociones históricas
    |--------------------------------------------------------------------------
    */

    if (promocionesHistoricas.length) {

      await InteligenciaPromocionHistorico.bulkCreate(
        promocionesHistoricas,
        {
          transaction,
        }
      );

    }


    /*
    |--------------------------------------------------------------------------
    | 9. Confirmar transacción
    |--------------------------------------------------------------------------
    */

    await transaction.commit();


    return {
      snapshot_id: snapshot.id,

      fecha: snapshot.fecha,

      precios_guardados:
        preciosHistoricos.length,

      promociones_guardadas:
        promocionesHistoricas.length,

      omitido: false,
    };

  }
  catch (error) {

    await transaction.rollback();

    throw error;

  }

};

export const listarSnapshots = async () => {

  return await InteligenciaSnapshot.findAll({
    attributes: [
      "id",
      "fecha",
      "observaciones",
      "usuario_id",
      "createdAt",
    ],

    include: [
      {
        model: InteligenciaPrecioHistorico,
        as: "precios",
        attributes: ["id"],
      },
      {
        model: InteligenciaPromocionHistorico,
        as: "promociones",
        attributes: ["id"],
      },
    ],

    order: [
      ["fecha", "DESC"],
      ["id", "DESC"],
    ],
  });
};


export const obtenerSnapshotPorId =
    async (id) => {

        const snapshot =
            await InteligenciaSnapshot.findByPk(
                id,
                {

                    include: [

                        {
                            model:
                                InteligenciaPrecioHistorico,

                            as:
                                "precios",

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
                                },

                            ],
                        },

                        {
                            model:
                                InteligenciaPromocionHistorico,

                            as:
                                "promociones",
                        },

                    ],

                }
            );


        if (!snapshot) {

            throw new Error(
                "La instantánea comercial no existe"
            );

        }


        return snapshot;

    };


export const eliminarSnapshot = async (id) => {

  const transaction =
    await sequelize.transaction();


  try {

    const snapshot =
      await InteligenciaSnapshot.findByPk(
        id,
        {
          transaction,
        }
      );


    if (!snapshot) {
      throw new Error(
        "La instantánea comercial no existe"
      );
    }


    /*
    | Eliminamos primero los detalles.
    |
    | No dependemos de CASCADE en la BD.
    */

    await InteligenciaPrecioHistorico.destroy({
      where: {
        snapshot_id: id,
      },
      transaction,
    });


    await InteligenciaPromocionHistorico.destroy({
      where: {
        snapshot_id: id,
      },
      transaction,
    });


    await snapshot.destroy({
      transaction,
    });


    await transaction.commit();


    return {
      id,
      fecha: snapshot.fecha,
    };

  }
  catch (error) {

    await transaction.rollback();

    throw error;

  }

};

/*
|--------------------------------------------------------------------------
| FECHA ACTUAL EN ARGENTINA
|--------------------------------------------------------------------------
*/

const obtenerFechaArgentina = () => {

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
    ).formatToParts(
      new Date()
    );


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


  return (
    `${valores.year}-` +
    `${valores.month}-` +
    `${valores.day}`
  );

};


/*
|--------------------------------------------------------------------------
| SINCRONIZAR SNAPSHOT DIARIO
|--------------------------------------------------------------------------
|
| Captura el estado comercial ACTUAL:
|
| - precios actuales
| - promociones configuradas actualmente
|
| para la fecha comercial de HOY en Argentina.
|
| Es idempotente:
|
| si ya existe snapshot para hoy, no vuelve a crearlo.
|--------------------------------------------------------------------------
*/

export const sincronizarSnapshotDiario =
  async () => {

    const fecha =
      obtenerFechaArgentina();


    console.log(
      `[Inteligencia Comercial] Sincronizando snapshot comercial ${fecha}`
    );


    const resultado =
      await crearSnapshotComercial({

        fecha,

        observaciones:
          "Snapshot automático diario",

        usuario_id:
          null,

        omitir_si_existe:
          true,

      });


    return {
      automatico: true,
      ...resultado,
    };

  };