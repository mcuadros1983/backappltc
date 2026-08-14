import EvaluacionSistema from "../../models/evaluacion/evaluacionSistemaModel.js";

/*=========================================================
  VALIDAR PESOS
=========================================================*/

const validarPesos = (configuracion) => {

    const total =

        Number(configuracion.peso_competencias || 0) +

        Number(configuracion.peso_metas || 0) +

        Number(configuracion.peso_kpis || 0) +

        Number(configuracion.peso_valores || 0) +

        Number(configuracion.peso_objetivos || 0) +

        Number(configuracion.peso_capacitacion || 0);

    return total === 100;

};

/*=========================================================
  OBTENER CONFIGURACIÓN
=========================================================*/

export const obtenerConfiguracion = async (req, res) => {

    try {

        // const empresa_id =

        //     req.query.empresa_id

        //         ? Number(req.query.empresa_id)

        //         : null;


        let configuracion =
            await EvaluacionSistema.findOne();

        if (!configuracion) {

            configuracion =
                await EvaluacionSistema.create({});
        }

        res.json(configuracion);

    }

    catch (error) {

        console.error(error);

        res.status(500).json({

            message:

                "Error obteniendo la configuración."

        });

    }

};

/*=========================================================
  GUARDAR CONFIGURACIÓN
=========================================================*/

export const guardarConfiguracion = async (req, res) => {

    const transaction =
        await EvaluacionSistema.sequelize.transaction();

    try {

        // const empresa_id =

        //     req.query.empresa_id

        //         ? Number(req.query.empresa_id)

        //         : null;


        const data = {

            ...req.body,

            // empresa_id

        };

        /*=========================================
          VALIDAR PESOS
        =========================================*/

        if (!validarPesos(data)) {

            await transaction.rollback();

            return res.status(400).json({

                message:
                    "La suma de los pesos debe ser exactamente 100%."

            });

        }

        /*=========================================
          BUSCAR CONFIGURACIÓN
        =========================================*/

        let configuracion =
            await EvaluacionSistema.findOne({

                // where: {

                //     empresa_id

                // },

                transaction

            });

        /*=========================================
          ACTUALIZAR
        =========================================*/

        if (configuracion) {

            await configuracion.update(

                data,

                {

                    transaction

                }

            );

        }

        /*=========================================
          CREAR
        =========================================*/

        else {

            configuracion =
                await EvaluacionSistema.create(

                    data,

                    {

                        transaction

                    }

                );

        }

        await transaction.commit();

        res.json({

            ok: true,

            message:

                "Configuración guardada correctamente.",

            configuracion

        });

    }

    catch (error) {

        await transaction.rollback();

        console.error(error);

        res.status(500).json({

            message:

                "Error guardando la configuración."

        });

    }

};

