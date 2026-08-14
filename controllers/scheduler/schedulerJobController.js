import SchedulerJob from "../../models/scheduler/schedulerJobModel.js";
import schedulerService from "../../services/scheduler/schedulerService.js";

/*=========================================================
  LISTAR JOBS
=========================================================*/

export const listarJobs = async (req, res) => {
    try {
        const items = await SchedulerJob.findAll({
            order: [
                ["modulo", "ASC"],
                ["orden", "ASC"],
                ["nombre", "ASC"]
            ]
        });

        res.json(items);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Error obteniendo los jobs."
        });
    }
};

/*=========================================================
  OBTENER JOB
=========================================================*/

export const obtenerJob = async (req, res) => {
    try {
        const { id } = req.params;

        const item = await SchedulerJob.findByPk(id);

        if (!item) {
            return res.status(404).json({
                message: "Job no encontrado."
            });
        }

        res.json(item);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Error obteniendo el job."
        });
    }
};

/*=========================================================
  CREAR JOB
=========================================================*/

export const crearJob = async (req, res) => {
    const transaction = await SchedulerJob.sequelize.transaction();

    try {
        const existe = await SchedulerJob.findOne({
            where: {
                codigo: req.body.codigo
            },
            transaction
        });

        if (existe) {
            await transaction.rollback();

            return res.status(400).json({
                message: "Ya existe un job con ese código."
            });
        }

        const item = await SchedulerJob.create(
            req.body,
            {
                transaction
            }
        );

        await transaction.commit();

        res.status(201).json(item);
    } catch (error) {
        await transaction.rollback();

        console.error(error);

        res.status(500).json({
            message: "Error creando el job."
        });
    }
};

/*=========================================================
  ACTUALIZAR JOB
=========================================================*/

export const actualizarJob = async (req, res) => {
    const transaction = await SchedulerJob.sequelize.transaction();

    try {
        const { id } = req.params;

        const item = await SchedulerJob.findByPk(
            id,
            {
                transaction
            }
        );

        if (!item) {
            await transaction.rollback();

            return res.status(404).json({
                message: "Job no encontrado."
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
    } catch (error) {
        await transaction.rollback();

        console.error(error);

        res.status(500).json({
            message: "Error actualizando el job."
        });
    }
};

/*=========================================================
  ELIMINAR JOB
=========================================================*/

export const eliminarJob = async (req, res) => {
    const transaction = await SchedulerJob.sequelize.transaction();

    try {
        const { id } = req.params;

        const item = await SchedulerJob.findByPk(
            id,
            {
                transaction
            }
        );

        if (!item) {
            await transaction.rollback();

            return res.status(404).json({
                message: "Job no encontrado."
            });
        }

        await item.destroy({
            transaction
        });

        await transaction.commit();

        res.json({
            ok: true,
            message: "Job eliminado correctamente."
        });
    } catch (error) {
        await transaction.rollback();

        console.error(error);

        res.status(500).json({
            message: "Error eliminando el job."
        });
    }
};

/*=========================================================
  EJECUTAR JOB AHORA
=========================================================*/

export const ejecutarAhora = async (req, res) => {
    try {
        const { id } = req.params;

        const item = await SchedulerJob.findByPk(id);

        if (!item) {
            return res.status(404).json({
                message: "Job no encontrado."
            });
        }

        const resultado = await schedulerService.runNow(
            item.codigo
        );

        res.json({
            ok: true,
            resultado
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: error.message || "Error ejecutando el job."
        });
    }
};