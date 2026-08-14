import EvaluacionMeta
    from "../../models/evaluacion/evaluacionMetaModel.js";

import EvaluacionMetaAsignacion
    from "../../models/evaluacion/evaluacionMetaAsignacionModel.js";

import { inicializarMetasDefault } from "../../services/evaluacion/metaService.js"
/*=========================================================
  LISTAR
=========================================================*/

export const listarMetas = async (req, res) => {

    try {

        const metas =
            await EvaluacionMeta.findAll({

                order: [

                    ["codigo", "ASC"]

                ]

            });

        res.json(

            metas

        );

    }

    catch (error) {

        console.error(error);

        res.status(500).json({

            message:

                "Error obteniendo las metas."

        });

    }

};

/*=========================================================
  OBTENER
=========================================================*/

export const obtenerMeta = async (req, res) => {

    try {

        const meta =
            await EvaluacionMeta.findByPk(

                req.params.id

            );

        if (!meta) {

            return res.status(404).json({

                message:

                    "Meta no encontrada."

            });

        }

        res.json(

            meta

        );

    }

    catch (error) {

        console.error(error);

        res.status(500).json({

            message:

                "Error obteniendo la meta."

        });

    }

};

/*=========================================================
  CREAR
=========================================================*/

export const crearMeta = async (req, res) => {

    try {

        const {

            empresa_id,

            sucursal_id,

            codigo,

            nombre,

            descripcion,

            tipo,

            prioridad,

            unidad_medida,

            valor_objetivo,

            ponderacion,

            estado,

            observaciones,

            usuario_creacion,

            capa,

            comparacion,

            frecuencia_unidad,

            categoria,

        } = req.body;

        if (!codigo || !nombre) {

            return res.status(400).json({

                message:

                    "Debe indicar código y nombre."

            });

        }

        if (

            categoria === "BRECHA" &&

            !comparacion

        ) {

            return res.status(400).json({

                message:

                    "Debe indicar la comparación."

            });

        }
        if (

            categoria === "FRECUENCIA" &&

            !frecuencia_unidad

        ) {

            return res.status(400).json({

                message:

                    "Debe indicar la unidad de frecuencia."

            });

        }

        const meta =
            await EvaluacionMeta.create({

                empresa_id,

                sucursal_id,

                codigo,

                nombre,

                descripcion,

                tipo,

                prioridad,

                unidad_medida,

                valor_objetivo,

                ponderacion,

                estado,

                observaciones,

                usuario_creacion,

                capa,

                comparacion,

                frecuencia_unidad,

                categoria

            });

        res.status(201).json(

            meta

        );

    }

    catch (error) {

        console.error(error);

        res.status(500).json({

            message:

                "Error creando la meta."

        });

    }

};

/*=========================================================
  ACTUALIZAR
=========================================================*/

export const actualizarMeta = async (req, res) => {

    try {

        const meta =
            await EvaluacionMeta.findByPk(

                req.params.id

            );

        if (!meta) {

            return res.status(404).json({

                message:

                    "Meta no encontrada."

            });

        }

        const {

            empresa_id,

            sucursal_id,

            codigo,

            nombre,

            descripcion,

            tipo,

            prioridad,

            unidad_medida,

            valor_objetivo,

            ponderacion,

            estado,

            observaciones,

            usuario_creacion,

            capa,

            comparacion,

            frecuencia_unidad,

            categoria

        } = req.body;

        await meta.update({

            empresa_id,

            sucursal_id,

            codigo,

            nombre,

            descripcion,

            tipo,

            prioridad,

            unidad_medida,

            valor_objetivo,

            ponderacion,

            estado,

            observaciones,

            usuario_creacion,

            capa,

            comparacion,

            frecuencia_unidad,

            categoria

        });

        res.json(

            meta

        );

    }

    catch (error) {

        console.error(error);

        res.status(500).json({

            message:

                "Error actualizando la meta."

        });

    }

};

/*=========================================================
  ELIMINAR
=========================================================*/

export const eliminarMeta = async (req, res) => {

    try {

        const meta =
            await EvaluacionMeta.findByPk(

                req.params.id

            );

        if (!meta) {

            return res.status(404).json({

                message:

                    "Meta no encontrada."

            });

        }

        const asignaciones =
            await EvaluacionMetaAsignacion.count({

                where: {

                    meta_id: meta.id

                }

            });

        if (asignaciones > 0) {

            return res.status(400).json({

                message:

                    "La meta posee asignaciones y no puede eliminarse."

            });

        }

        await meta.destroy();

        res.json({

            message:

                "Meta eliminada correctamente."

        });

    }

    catch (error) {

        console.error(error);

        res.status(500).json({

            message:

                "Error eliminando la meta."

        });

    }

};

export const activarMeta = async (req, res) => {

    try {

        const meta =

            await EvaluacionMeta.findByPk(

                req.params.id

            );

        if (!meta) {

            return res.status(404).json({

                message:

                    "Meta no encontrada."

            });

        }

        await meta.update({

            estado: "ACTIVA"

        });

        res.json(meta);

    }

    catch (error) {

        console.error(error);

        res.status(500).json({

            message:

                "Error activando la meta."

        });

    }

};

export const desactivarMeta = async (req, res) => {

    try {

        const meta =

            await EvaluacionMeta.findByPk(

                req.params.id

            );

        if (!meta) {

            return res.status(404).json({

                message:

                    "Meta no encontrada."

            });

        }

        await meta.update({

            estado: "INACTIVA"

        });

        res.json(meta);

    }

    catch (error) {

        console.error(error);

        res.status(500).json({

            message:

                "Error desactivando la meta."

        });

    }

};

export const inicializarMetas = async (

    req,

    res

) => {

    try {

        const existentes =

            await EvaluacionMeta.count();

        if (existentes > 0) {

            return res.json({

                message:

                    "Las metas ya fueron inicializadas."

            });

        }

        const resultado =

            await inicializarMetasDefault();

        res.json(resultado);

    }

    catch (error) {

        console.error(error);

        res.status(500).json({

            message:

                "Error inicializando metas."

        });

    }

};

export const listarMetasActivas = async (req, res) => {

    try {

        const metas =

            await EvaluacionMeta.findAll({

                where: {

                    estado: "ACTIVA"

                },

                order: [

                    ["categoria", "ASC"],

                    ["codigo", "ASC"]

                ]

            });

        res.json(metas);

    }

    catch (error) {

        console.error(error);

        res.status(500).json({

            message:

                "Error obteniendo las metas activas."

        });

    }

}; export const listarMetasPorCategoria = async (req, res) => {

    try {

        const metas =

            await EvaluacionMeta.findAll({

                where: {

                    categoria:

                        req.params.categoria

                },

                order: [

                    ["codigo", "ASC"]

                ]

            });

        res.json(metas);

    }

    catch (error) {

        console.error(error);

        res.status(500).json({

            message:

                "Error obteniendo las metas."

        });

    }

};

