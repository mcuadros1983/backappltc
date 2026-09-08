import LibroIVA from "../../../models/iva/libroiva.js";

import Empresa
    from "../../../models/comun/empresa.js";


/*=========================================================
  OBTENER PERÍODO ACTUAL - ARGENTINA
=========================================================*/

const obtenerPeriodoActual = () => {

    const partes =
        new Intl.DateTimeFormat(
            "es-AR",
            {
                timeZone:
                    "America/Argentina/Buenos_Aires",

                year:
                    "numeric",

                month:
                    "numeric",
            }
        )
            .formatToParts(
                new Date()
            );


    const anio =
        Number(
            partes.find(
                (p) =>
                    p.type === "year"
            )?.value
        );


    const mes =
        Number(
            partes.find(
                (p) =>
                    p.type === "month"
            )?.value
        );


    return {
        mes,
        anio,
    };

};


/*=========================================================
  JOB
=========================================================*/

const libroIVAMensualJob = async () => {

    const {
        mes,
        anio,
    } =
        obtenerPeriodoActual();


    console.log(
        `[LIBRO IVA] Verificando período ${mes}/${anio}...`
    );


    const empresas =
        await Empresa.findAll({
            attributes: [
                "id",
                "descripcion",
            ],
        });


    let creados = 0;

    let existentes = 0;


    for (const empresa of empresas) {

        const [
            libro,
            creado,
        ] =
            await LibroIVA.findOrCreate({

                where: {

                    empresa_id:
                        empresa.id,

                    mes,

                    anio,

                },

                defaults: {

                    empresa_id:
                        empresa.id,

                    mes,

                    anio,

                },

            });


        if (creado) {

            creados++;

            console.log(
                `[LIBRO IVA] Creado ${mes}/${anio} - Empresa ${empresa.id} (${empresa.descripcion})`
            );

        } else {

            existentes++;

        }

    }


    console.log(
        `[LIBRO IVA] Verificación finalizada. Creados: ${creados}. Existentes: ${existentes}.`
    );


    return {

        mes,

        anio,

        empresas:
            empresas.length,

        creados,

        existentes,

    };

};


export default libroIVAMensualJob;