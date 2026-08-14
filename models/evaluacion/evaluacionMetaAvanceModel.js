import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const EvaluacionMetaAvance = sequelize.define(

    "EvaluacionMetaAvance",

    {

        id: {

            type: DataTypes.INTEGER,

            primaryKey: true,

            autoIncrement: true

        },

        asignacion_id: {

            type: DataTypes.INTEGER,

            allowNull: false

        },

        fecha: {

            type: DataTypes.DATEONLY,

            allowNull: false

        },

        valor_anterior: {

            type: DataTypes.DECIMAL(18,2),

            allowNull: false,

            defaultValue: 0

        },

        valor_actual: {

            type: DataTypes.DECIMAL(18,2),

            allowNull: false,

            defaultValue: 0

        },

        porcentaje: {

            type: DataTypes.DECIMAL(6,2),

            allowNull: false,

            defaultValue: 0

        },

        comentario: {

            type: DataTypes.TEXT,

            allowNull: true

        },

        usuario_id: {

            type: DataTypes.INTEGER,

            allowNull: true

        }

    },

    {

        tableName: "evaluacion_meta_avance",

        timestamps: true,

        underscored: true

    }

);

export default EvaluacionMetaAvance;