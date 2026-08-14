import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";
 
const EvaluacionMetaAsignacion = sequelize.define(

    "EvaluacionMetaAsignacion",

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

        meta_id: {

            type: DataTypes.INTEGER,

            allowNull: false

        },

        empleado_id: {

            type: DataTypes.INTEGER,

            allowNull: false

        },

        supervisor_id: {

            type: DataTypes.INTEGER,

            allowNull: true

        },

        periodo_id: {

            type: DataTypes.INTEGER,

            allowNull: true

        },

        fecha_inicio: {

            type: DataTypes.DATEONLY,

            allowNull: false

        },

        fecha_fin: {

            type: DataTypes.DATEONLY,

            allowNull: false

        },

        valor_actual: {

            type: DataTypes.DECIMAL(18,2),

            allowNull: false,

            defaultValue: 0

        },

        porcentaje_cumplimiento: {

            type: DataTypes.DECIMAL(6,2),

            allowNull: false,

            defaultValue: 0

        },

        estado: {

            type: DataTypes.STRING(30),

            allowNull: false,

            defaultValue: "ASIGNADA"

        },

        observaciones: {

            type: DataTypes.TEXT,

            allowNull: true

        }

    },

    {

        tableName: "evaluacion_meta_asignacion",

        timestamps: true,

        underscored: true

    }

);

export default EvaluacionMetaAsignacion;