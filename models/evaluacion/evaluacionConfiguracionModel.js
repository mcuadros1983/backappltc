import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const EvaluacionConfiguracion = sequelize.define(
    "EvaluacionConfiguracion",
    {

        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },

        permitir_autoevaluacion: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },

        permitir_reapertura: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },

        mostrar_resultado_empleado: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },

        requerir_comentario: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },

        permitir_adjuntos: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },

        permitir_firma: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },

        dias_vigencia: {
            type: DataTypes.INTEGER,
            defaultValue: 30
        }

    },
    {
        tableName: "evaluacion_configuracion",
        freezeTableName: true,
        timestamps: false
    }
);

export default EvaluacionConfiguracion;