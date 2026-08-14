const FERIADOS_ARGENTINA = {

    /*
    |--------------------------------------------------------------------------
    | Los calendarios se incorporan por año.
    |--------------------------------------------------------------------------
    |
    | Fuente oficial:
    | Argentina.gob.ar
    |
    | La fecha almacenada debe ser la fecha EFECTIVA del feriado,
    | incluyendo los traslados oficiales.
    |
    */

    2026: [

        {
            fecha: "2026-01-01",
            nombre: "Año Nuevo",
            ambito: "NACIONAL",
            tipo_feriado: "INAMOVIBLE",
        },

        // ...

    ],

};


export const obtenerFeriadosArgentina =
    (anio) => {

        const feriados =
            FERIADOS_ARGENTINA[
            Number(anio)
            ];


        if (!feriados) {

            return null;

        }


        return feriados;

    };


export default FERIADOS_ARGENTINA;