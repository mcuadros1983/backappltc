import { DataTypes } from "sequelize";

import { sequelize } from "../../config/database.js";

const EvaluacionComunicacion = sequelize.define(

    "EvaluacionComunicacion",

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

        sucursal_id: {

            type: DataTypes.INTEGER,

            allowNull: false

        },

        evaluacion_id: {

            type: DataTypes.INTEGER,

            allowNull: true

        },

        canal: {

            type: DataTypes.STRING(30),

            allowNull: false,

            defaultValue: "EMAIL"

        },

        tipo: {

            type: DataTypes.STRING(50),

            allowNull: false

        },

        destinatario: {

            type: DataTypes.STRING(200),

            allowNull: false

        },

        asunto: {

            type: DataTypes.STRING(300),

            allowNull: false

        },

        contenido: {

            type: DataTypes.TEXT,

            allowNull: true

        },

        estado: {

            type: DataTypes.STRING(30),

            allowNull: false,

            defaultValue: "PENDIENTE"

        },

        error: {

            type: DataTypes.TEXT,

            allowNull: true

        },

        fecha_envio: {

            type: DataTypes.DATE,

            allowNull: true

        },

        usuario_creacion: {

            type: DataTypes.INTEGER,

            allowNull: true

        }

    },

    {

        tableName:

            "evaluacion_comunicacion",

        timestamps: true,

        underscored: true

    }

);

export default EvaluacionComunicacion;