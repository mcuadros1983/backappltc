import { Op } from "sequelize";

import EvaluacionEscala
    from "../../models/evaluacion/evaluacionEscalaModel.js";
/*=========================================================
  LISTAR ESCALAS
=========================================================*/

export const listarEscalas = async (req, res) => {

    try {

        // const empresa_id =

        //     req.query.empresa_id

        //         ? Number(req.query.empresa_id)

        //         : null;


        const items =
            await EvaluacionEscala.findAll({

                // where: {

                //     empresa_id

                // },

                order: [

                    ["orden", "ASC"],

                    ["valor_desde", "DESC"]

                ]

            });

        res.json(items);

    }

    catch (error) {

        console.error(error);

        res.status(500).json({

            message:

                "Error obteniendo las escalas."

        });

    }

};

/*=========================================================
  OBTENER ESCALA
=========================================================*/

export const obtenerEscala = async (req, res) => {

    try {

        const { id } = req.params;

        // const empresa_id =

        //     req.query.empresa_id

        //         ? Number(req.query.empresa_id)

        //         : null;


        const item =
            await EvaluacionEscala.findOne({

                where: {

                    id,

                    // empresa_id

                }

            });

        if (!item) {

            return res.status(404).json({

                message:

                    "Escala no encontrada."

            });

        }

        res.json(item);

    }

    catch (error) {

        console.error(error);

        res.status(500).json({

            message:

                "Error obteniendo la escala."

        });

    }

};

/*=========================================================
  VALIDAR RANGO ESCALA
=========================================================*/


const validarRangoEscala = async ({

    id = null,

    // empresa_id,

    codigo,

    valor_desde,

    valor_hasta

}) => {

    const desde = Number(valor_desde);

    const hasta = Number(valor_hasta);

    /*=========================================
      VALIDAR NUMÉRICOS
    =========================================*/

    if (

        Number.isNaN(desde) ||

        Number.isNaN(hasta)

    ) {

        return {

            ok: false,

            message:

                "Los valores de la escala son inválidos."

        };

    }

    /*=========================================
      VALIDAR LÍMITES
    =========================================*/

    if (

        desde < 0 ||

        hasta > 100

    ) {

        return {

            ok: false,

            message:

                "Los valores deben estar entre 0 y 100."

        };

    }

    /*=========================================
      VALIDAR RANGO
    =========================================*/

    if (

        desde > hasta

    ) {

        return {

            ok: false,

            message:

                "El valor desde no puede ser mayor al valor hasta."

        };

    }

    /*=========================================
      VALIDAR CÓDIGO
    =========================================*/

    const whereCodigo = {

        // empresa_id,

        codigo

    };

    if (id) {

        whereCodigo.id = {

            [Op.ne]: id

        };

    }

    const codigoExistente =

        await EvaluacionEscala.findOne({

            where: whereCodigo

        });

    if (codigoExistente) {

        return {

            ok: false,

            message:

                "Ya existe una escala con ese código."

        };

    }

    /*=========================================
      VALIDAR TRASLAPE
    =========================================*/

    const whereTraslape = {

        // empresa_id,

        valor_desde: {

            [Op.lte]: hasta

        },

        valor_hasta: {

            [Op.gte]: desde

        }

    };

    if (id) {

        whereTraslape.id = {

            [Op.ne]: id

        };

    }

    const traslape =

        await EvaluacionEscala.findOne({

            where: whereTraslape

        });

    if (traslape) {

        return {

            ok: false,

            message:

                `La escala se traslapa con "${traslape.nombre}".`

        };

    }

    return {

        ok: true

    };

};

/*=========================================================
  CREAR ESCALA
=========================================================*/

export const crearEscala = async (req, res) => {

    const transaction =
        await EvaluacionEscala.sequelize.transaction();

    try {

        // const empresa_id =

        //     req.query.empresa_id

        //         ? Number(req.query.empresa_id)

        //         : null;


        const validacion =

            await validarRangoEscala({

                // empresa_id,

                codigo: req.body.codigo,

                valor_desde: req.body.valor_desde,

                valor_hasta: req.body.valor_hasta

            });

        if (!validacion.ok) {

            await transaction.rollback();

            return res.status(400).json({

                message:

                    validacion.message

            });

        }

        const item =
            await EvaluacionEscala.create(

                {

                    ...req.body,

                    // empresa_id

                },

                {

                    transaction

                }

            );

        await transaction.commit();

        res.status(201).json(item);

    }

    catch (error) {

        await transaction.rollback();

        console.error(error);

        res.status(500).json({

            message:

                "Error creando la escala."

        });

    }

};

/*=========================================================
  ACTUALIZAR ESCALA
=========================================================*/

export const actualizarEscala = async (req, res) => {

    const transaction =
        await EvaluacionEscala.sequelize.transaction();

    try {

        const { id } = req.params;

        // const empresa_id =

        //     req.query.empresa_id

        //         ? Number(req.query.empresa_id)

        //         : null;


        const item =
            await EvaluacionEscala.findOne({

                where: {

                    id,

                    // empresa_id

                },

                transaction

            });

        if (!item) {

            await transaction.rollback();

            return res.status(404).json({

                message:

                    "Escala no encontrada."

            });

        }

        const validacion =

            await validarRangoEscala({

                id,

                // empresa_id,

                codigo: req.body.codigo,

                valor_desde: req.body.valor_desde,

                valor_hasta: req.body.valor_hasta

            });

        if (!validacion.ok) {

            await transaction.rollback();

            return res.status(400).json({

                message:

                    validacion.message

            });

        }

        await item.update(

            req.body,

            {

                transaction

            }

        );

        await transaction.commit();

        res.json(item);

    }

    catch (error) {

        await transaction.rollback();

        console.error(error);

        res.status(500).json({

            message:

                "Error actualizando la escala."

        });

    }

};

/*=========================================================
  ELIMINAR ESCALA
=========================================================*/

export const eliminarEscala = async (req, res) => {

    const transaction =
        await EvaluacionEscala.sequelize.transaction();

    try {

        const { id } = req.params;

        // const empresa_id =

        //     req.query.empresa_id

        //         ? Number(req.query.empresa_id)

        //         : null;


        const item =
            await EvaluacionEscala.findOne({

                where: {

                    id,

                    // empresa_id

                },

                transaction

            });

        if (!item) {

            await transaction.rollback();

            return res.status(404).json({

                message:

                    "Escala no encontrada."

            });

        }

        await item.destroy({

            transaction

        });

        await transaction.commit();

        res.json({

            ok: true,

            message:

                "Escala eliminada correctamente."

        });

    }

    catch (error) {

        await transaction.rollback();

        console.error(error);

        res.status(500).json({

            message:

                "Error eliminando la escala."

        });

    }

};

