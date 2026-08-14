import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

import SchedulerJob from "./schedulerJobModel.js";

const SchedulerExecution = sequelize.define(

    "SchedulerExecution",

    {

        job_id: {

            type: DataTypes.INTEGER,

            allowNull: false

        },

        job_codigo: {

            type: DataTypes.STRING(100),

            allowNull: false

        },


        inicio: {

            type: DataTypes.DATE,

            allowNull: false

        },

        fin: {

            type: DataTypes.DATE,

            allowNull: true

        },

        duracion: {

            type: DataTypes.INTEGER,

            allowNull: true

        },

        estado: {

            type: DataTypes.STRING(30),

            defaultValue: "PENDIENTE"

        },

        mensaje: {

            type: DataTypes.TEXT

        },

        resultado: {

            type: DataTypes.JSON,

            allowNull: true

        }

    },

    {

        tableName: "scheduler_execution",

        timestamps: true

    }

);

SchedulerJob.hasMany(

    SchedulerExecution,

    {

        foreignKey: "job_id",

        as: "ejecuciones"

    }

);

SchedulerExecution.belongsTo(

    SchedulerJob,

    {

        foreignKey: "job_id",

        as: "job"

    }

);

export default SchedulerExecution;