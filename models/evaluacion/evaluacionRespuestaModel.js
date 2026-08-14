import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const EvaluacionRespuesta = sequelize.define(
    "EvaluacionRespuesta",
    {

        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },

        evaluacion_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },

        empleado_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },

        evaluador_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },

        tipo_respuesta: {
            type: DataTypes.ENUM(
                "AUTO",
                "SUPERVISOR",
                "MYSTERY"
            ),
            allowNull: false,
        },

        fecha_respuesta: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },

        estado: {
            type: DataTypes.ENUM(
                "BORRADOR",
                "FINALIZADA"
            ),
            allowNull: false,
            defaultValue: "FINALIZADA",
        },

        observaciones: {
            type: DataTypes.TEXT,
            allowNull: true,
        },

        puntaje_total: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0,
        },

        porcentaje: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0,
        }

    },
    {

        tableName: "evaluacion_respuesta",

        timestamps: true,

        createdAt: "created_at",

        updatedAt: "updated_at",

        freezeTableName: true,

    }

);

export default EvaluacionRespuesta;