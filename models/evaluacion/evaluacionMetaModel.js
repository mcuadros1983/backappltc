import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const EvaluacionMeta = sequelize.define(

    "EvaluacionMeta",

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

            allowNull: true

        },

        codigo: {

            type: DataTypes.STRING(30),

            allowNull: false,

            unique: true

        },

        nombre: {

            type: DataTypes.STRING(200),

            allowNull: false

        },

        descripcion: {

            type: DataTypes.TEXT,

            allowNull: true

        },

        tipo: {

            type: DataTypes.STRING(50),

            allowNull: false,

            defaultValue: "GENERAL"

        },

        categoria: {

            type: DataTypes.ENUM(

                "FRECUENCIA",

                "CUMPLIMIENTO",

                "BRECHA"

            ),

            allowNull: false,

            defaultValue: "FRECUENCIA"

        },

        prioridad: {

            type: DataTypes.STRING(20),

            allowNull: false,

            defaultValue: "MEDIA"

        },

        unidad_medida: {

            type: DataTypes.STRING(50),

            allowNull: false,

            defaultValue: "PORCENTAJE"

        },

        capa: {

            type: DataTypes.STRING(30),

            allowNull: false,

            defaultValue: "GENERAL"

        },

        comparacion: {

            type: DataTypes.STRING(100),

            allowNull: true

        },

        frecuencia_unidad: {

            type: DataTypes.STRING(20),

            allowNull: false,

            defaultValue: "DIAS"

        },

        valor_objetivo: {

            type: DataTypes.DECIMAL(18, 2),

            allowNull: false,

            defaultValue: 0

        },

        ponderacion: {

            type: DataTypes.DECIMAL(5, 2),

            allowNull: false,

            defaultValue: 100

        },

        estado: {

            type: DataTypes.STRING(20),

            allowNull: false,

            defaultValue: "ACTIVA"

        },

        observaciones: {

            type: DataTypes.TEXT,

            allowNull: true

        },

        usuario_creacion: {

            type: DataTypes.INTEGER,

            allowNull: true

        }

    },

    {

        tableName: "evaluacion_meta",

        timestamps: true,

        underscored: true

    }

);

export default EvaluacionMeta;