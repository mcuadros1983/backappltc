import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const EvaluacionRespuestaDetalle = sequelize.define(
    "EvaluacionRespuestaDetalle",
    {

        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },

        respuesta_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },

        criterio_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },

        valor: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },

        comentario: {
            type: DataTypes.TEXT,
            allowNull: true,
        },

        evidencia: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },

        puntaje: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0,
        }

    },
    {

        tableName: "evaluacion_respuesta_detalle",

        timestamps: false,

        freezeTableName: true,

    }

);

export default EvaluacionRespuestaDetalle;