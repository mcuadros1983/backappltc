// models/evaluacion/evaluacionSistemaModel.js

import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const EvaluacionSistema = sequelize.define(

    "EvaluacionSistema",

    {

        id: {

            type: DataTypes.INTEGER,

            primaryKey: true,

            autoIncrement: true

        },

        empresa_id: {

            type: DataTypes.INTEGER,

            allowNull: true

            // unique: true

        },

        sucursal_id: {

            type: DataTypes.INTEGER,

            allowNull: true

        },

        /*=========================================================
          CONFIGURACIÓN GENERAL
        =========================================================*/

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

        },

        /*=========================================================
          PESOS
        =========================================================*/

        peso_competencias: {

            type: DataTypes.DECIMAL(5,2),

            defaultValue: 70

        },

        peso_metas: {

            type: DataTypes.DECIMAL(5,2),

            defaultValue: 30

        },

        peso_kpis: {

            type: DataTypes.DECIMAL(5,2),

            defaultValue: 0

        },

        peso_valores: {

            type: DataTypes.DECIMAL(5,2),

            defaultValue: 0

        },

        peso_objetivos: {

            type: DataTypes.DECIMAL(5,2),

            defaultValue: 0

        },

        peso_capacitacion: {

            type: DataTypes.DECIMAL(5,2),

            defaultValue: 0

        },

        /*=========================================================
          NOTIFICACIONES
        =========================================================*/

        enviar_correos: {

            type: DataTypes.BOOLEAN,

            defaultValue: true

        },

        recordar_dias_antes: {

            type: DataTypes.INTEGER,

            defaultValue: 7

        },

        recordar_supervisor: {

            type: DataTypes.BOOLEAN,

            defaultValue: true

        },

        recordar_rrhh: {

            type: DataTypes.BOOLEAN,

            defaultValue: true

        },

        /*=========================================================
          EVALUACIONES
        =========================================================*/

        cerrar_automaticamente: {

            type: DataTypes.BOOLEAN,

            defaultValue: false

        },

        permitir_editar_finalizadas: {

            type: DataTypes.BOOLEAN,

            defaultValue: false

        },

        duplicar_periodo: {

            type: DataTypes.BOOLEAN,

            defaultValue: false

        },

        /*=========================================================
          METAS
        =========================================================*/

        calcular_automaticamente: {

            type: DataTypes.BOOLEAN,

            defaultValue: true

        },

        permitir_sobrecumplimiento: {

            type: DataTypes.BOOLEAN,

            defaultValue: true

        },

        decimales: {

            type: DataTypes.INTEGER,

            defaultValue: 2

        },

        /*=========================================================
          DASHBOARD
        =========================================================*/

        mostrar_dashboard: {

            type: DataTypes.BOOLEAN,

            defaultValue: true

        },

        mostrar_ranking: {

            type: DataTypes.BOOLEAN,

            defaultValue: true

        },

        mostrar_heatmap: {

            type: DataTypes.BOOLEAN,

            defaultValue: true

        },

        mostrar_radar: {

            type: DataTypes.BOOLEAN,

            defaultValue: true

        },

        mostrar_historico: {

            type: DataTypes.BOOLEAN,

            defaultValue: true

        }

    },

    {

        tableName: "evaluacion_sistema",

        timestamps: true,

        underscored: true

    }

);

export default EvaluacionSistema;