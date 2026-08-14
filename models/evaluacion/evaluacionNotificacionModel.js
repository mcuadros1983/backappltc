import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const EvaluacionNotificacion = sequelize.define(

    "EvaluacionNotificacion",

    {

        id: {

            type: DataTypes.INTEGER,

            primaryKey: true,

            autoIncrement: true,

        },

        empresa_id: {

            type: DataTypes.INTEGER,

            allowNull: true,


        },

        mail_1: {

            type: DataTypes.STRING(150),

            allowNull: true,

        },

        mail_2: {

            type: DataTypes.STRING(150),

            allowNull: true,

        },

        mail_3: {

            type: DataTypes.STRING(150),

            allowNull: true,

        },

        alerta_roja: {

            type: DataTypes.BOOLEAN,

            allowNull: false,

            defaultValue: true,

        },

        bandera_critica: {

            type: DataTypes.BOOLEAN,

            allowNull: false,

            defaultValue: true,

        },

        caida_rendimiento: {

            type: DataTypes.BOOLEAN,

            allowNull: false,

            defaultValue: true,

        },

        resumen_semanal: {

            type: DataTypes.BOOLEAN,

            allowNull: false,

            defaultValue: true,

        },

        resumen_mensual: {

            type: DataTypes.BOOLEAN,

            allowNull: false,

            defaultValue: true,

        },

        recordatorio_supervisiones: {

            type: DataTypes.BOOLEAN,

            allowNull: false,

            defaultValue: true,

        },

        baja_participacion: {

            type: DataTypes.BOOLEAN,

            allowNull: false,

            defaultValue: true,

        },

        dni_no_reconocido: {

            type: DataTypes.BOOLEAN,

            allowNull: false,

            defaultValue: true,

        },
        mejora_rendimiento: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },

        competencia_critica: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },

        autoevaluacion_desalineada: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },

        caida_sostenida: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },

        mejora_sostenida: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },

        tendencia_negativa: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },

        tendencia_positiva: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },

        estabilidad: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },

        consenso_evaluacion: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },

        riesgo_bajo: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },

        riesgo_medio: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },

        riesgo_alto: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },

        riesgo_critico: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },

    },

    {

        tableName: "evaluacion_notificacion",

        timestamps: true,

        createdAt: "created_at",

        updatedAt: "updated_at",

        freezeTableName: true,

    }

);

export default EvaluacionNotificacion;