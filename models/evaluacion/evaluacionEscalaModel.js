// models/evaluacion/evaluacionEscalaModel.js

import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const EvaluacionEscala = sequelize.define(

    "EvaluacionEscala",

    {

        id: {

            type: DataTypes.INTEGER,

            primaryKey: true,

            autoIncrement: true

        },

        empresa_id: {

            type: DataTypes.INTEGER,

            allowNull: true

        },

        nombre: {

            type: DataTypes.STRING(80),

            allowNull: false

        },

        descripcion: {

            type: DataTypes.STRING(200),

            allowNull: true

        },

        valor_desde: {

            type: DataTypes.DECIMAL(5, 2),

            allowNull: false

        },

        valor_hasta: {

            type: DataTypes.DECIMAL(5, 2),

            allowNull: false

        },

        color: {

            type: DataTypes.STRING(30),

            allowNull: false,

            defaultValue: "success"

        },

        icono: {

            type: DataTypes.STRING(50),

            allowNull: true

        },

        orden: {

            type: DataTypes.INTEGER,

            defaultValue: 1

        },

        // estado: {

        //     type: DataTypes.STRING(20),

        //     defaultValue: "ACTIVO"

        // },
        activo: {

            type: DataTypes.BOOLEAN,

            defaultValue: true

        }

    },

    {

        tableName: "evaluacion_escala",

        timestamps: true,

        underscored: true

    }

);

export default EvaluacionEscala;