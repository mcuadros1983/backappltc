import motorConceptoEntidadAsignacionService
    from "../../services/motorConceptos/motorConceptoEntidadAsignacionService.js";

const getAll = async (
    req,
    res,
    next
) => {

    try {

        const result =
            await motorConceptoEntidadAsignacionService.getAll(
                req.user,
                req.query
            );

        res.json({
            success: true,
            ...result,
        });

    } catch (error) {

        next(error);

    }

};

const getById = async (
    req,
    res,
    next
) => {

    try {

        const result =
            await motorConceptoEntidadAsignacionService.getById(
                req.user,
                req.params.id
            );

        res.json({
            success: true,
            item: result,
        });

    } catch (error) {

        next(error);

    }

};

const getByEntidad =
    async (
        req,
        res,
        next
    ) => {

        try {

            const result =
                await motorConceptoEntidadAsignacionService.getByEntidad(

                    req.user,

                    req.query.entidad_tipo_id,

                    req.query.entidad_id

                );

            res.json({

                success: true,

                items: result,

            });

        } catch (error) {

            next(error);

        }

    };

const create = async (
    req,
    res,
    next
) => {

    try {

        const result =
            await motorConceptoEntidadAsignacionService.create(
                req.user,
                req.body
            );

        res.status(201).json({
            success: true,
            item: result,
        });

    } catch (error) {

        next(error);

    }

};

const update = async (
    req,
    res,
    next
) => {

    try {

        const result =
            await motorConceptoEntidadAsignacionService.update(
                req.user,
                req.params.id,
                req.body
            );

        res.json({
            success: true,
            item: result,
        });

    } catch (error) {

        next(error);

    }

};

const remove = async (
    req,
    res,
    next
) => {

    try {

        const result =
            await motorConceptoEntidadAsignacionService.remove(
                req.user,
                req.params.id
            );

        res.json({
            success: true,
            item: result,
        });

    } catch (error) {

        next(error);

    }

};

export default {

    getAll,

    getById,

    create,

    update,

    remove,
    getByEntidad

};