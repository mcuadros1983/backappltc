import PeriodoLiquidacion
    from "../../../models/sueldoempleado/periodoliquidacion.js";


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
  OBTENER FECHAS DEL PERÍODO
=========================================================*/

const obtenerFechasPeriodo = (
    anio,
    mes
) => {

    const fechaDesde =
        `${anio}-${String(mes).padStart(2, "0")}-01`;


    const ultimoDia =
        new Date(
            anio,
            mes,
            0
        ).getDate();


    const fechaHasta =
        `${anio}-${String(mes).padStart(2, "0")}-${String(
            ultimoDia
        ).padStart(2, "0")}`;


    return {
        fechaDesde,
        fechaHasta,
    };

};


/*=========================================================
  JOB
=========================================================*/

const periodoLiquidacionMensualJob =
    async () => {

        const {
            mes,
            anio,
        } =
            obtenerPeriodoActual();


        console.log(
            `[PERIODO LIQUIDACION] Verificando período ${mes}/${anio}...`
        );


        const {
            fechaDesde,
            fechaHasta,
        } =
            obtenerFechasPeriodo(
                anio,
                mes
            );


        const [
            periodo,
            creado,
        ] =
            await PeriodoLiquidacion.findOrCreate({

                where: {

                    anio,

                    mes,

                },

                defaults: {

                    anio,

                    mes,

                    fecha_desde:
                        fechaDesde,

                    fecha_hasta:
                        fechaHasta,

                    estado:
                        "abierto",

                },

            });


        if (creado) {

            console.log(
                `[PERIODO LIQUIDACION] Creado período ${mes}/${anio} (${fechaDesde} al ${fechaHasta})`
            );

        } else {

            console.log(
                `[PERIODO LIQUIDACION] El período ${mes}/${anio} ya existe. ID: ${periodo.id}`
            );

        }


        return {

            id:
                periodo.id,

            mes,

            anio,

            fecha_desde:
                periodo.fecha_desde,

            fecha_hasta:
                periodo.fecha_hasta,

            estado:
                periodo.estado,

            creado,

        };

    };


export default periodoLiquidacionMensualJob;