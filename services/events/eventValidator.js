/*=========================================================
  VALIDAR CONTRATO DEL EVENTO
=========================================================*/

const validate = (

    evento

) => {

    if (!evento) {

        throw new Error(

            "Debe especificar un evento."

        );

    }

    const requeridos = [

        "codigo",

        "modulo",

        "entidad",

        "entidad_id",

        "accion",

        "fecha",

        "datos"

    ];

    for (

        const campo

        of requeridos

    ) {

        if (

            evento[campo] === undefined ||

            evento[campo] === null

        ) {

            throw new Error(

                `El campo "${campo}" es obligatorio.`

            );

        }

    }

};

export default {

    validate

};