import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const SchedulerJob = sequelize.define(
    "SchedulerJob",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },

        codigo: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true
        },

        nombre: {
            type: DataTypes.STRING(150),
            allowNull: false
        },

        descripcion: {
            type: DataTypes.TEXT,
            allowNull: true
        },

        modulo: {
            type: DataTypes.STRING(100),
            allowNull: true
        },

        handler: {
            type: DataTypes.STRING(150),
            allowNull: false
        },

        cron: {
            type: DataTypes.STRING(100),
            allowNull: false
        },

        activo: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },

        orden: {
            type: DataTypes.INTEGER,
            defaultValue: 1
        },

        ultima_ejecucion: {
            type: DataTypes.DATE,
            allowNull: true
        },

        proxima_ejecucion: {
            type: DataTypes.DATE,
            allowNull: true
        }
    },
    {
        tableName: "scheduler_job",
        timestamps: true,
        underscored: true
    }
);

export default SchedulerJob;