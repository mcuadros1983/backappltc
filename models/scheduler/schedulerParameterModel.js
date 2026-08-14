import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

import SchedulerJob from "./schedulerJobModel.js";

const SchedulerParameter = sequelize.define(

    "SchedulerParameter",

    {

        job_id: {

            type: DataTypes.INTEGER,

            allowNull: false

        },

        clave: {

            type: DataTypes.STRING(100),

            allowNull: false

        },

        valor: {

            type: DataTypes.TEXT,

            allowNull: true

        }

    },

    {

        tableName: "scheduler_parameter",

        timestamps: true

    }

);

SchedulerJob.hasMany(

    SchedulerParameter,

    {

        foreignKey: "job_id",

        as: "parametros"

    }

);

SchedulerParameter.belongsTo(

    SchedulerJob,

    {

        foreignKey: "job_id",

        as: "job"

    }

);

export default SchedulerParameter;