import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

import EvaluacionTipo from "./evaluacionTipoModel.js";
import EvaluacionPeriodo from "./evaluacionPeriodoModel.js";

import EmpleadoTabla from "../tablas/empleadoModel.js";
import Usuario from "../auth/usuarioModel.js";

import crypto from "crypto";

const Evaluacion = sequelize.define(
    "Evaluacion",
    {

        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },

        numero: {
            type: DataTypes.STRING(30),
            allowNull: false,
            unique: true,
        },

        tipo_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },

        periodo_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },

        empleado_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },

        evaluador_usuario_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },

        // fecha: {
        //     type: DataTypes.DATEONLY,
        //     allowNull: true,
        // },

        fecha_inicio: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },

        fecha_fin: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },

        // token: {
        //     type: DataTypes.UUID,
        //     allowNull: false,
        //     defaultValue: DataTypes.UUIDV4,
        //     unique: true,
        // },

        estado: {
            type: DataTypes.STRING(20),
            allowNull: false,
            defaultValue: "BORRADOR",
        },

        observaciones: {
            type: DataTypes.TEXT,
            allowNull: true,
        },

        puntaje_total: {
            type: DataTypes.DECIMAL(10, 2),
            defaultValue: 0,
            allowNull: true,
        },

        porcentaje: {
            type: DataTypes.DECIMAL(10, 2),
            defaultValue: 0,
            allowNull: true,
        },
        plantilla_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        evaluador_dni: {
            type: DataTypes.STRING(20),
            allowNull: true,
        },

        evaluador_nombre: {
            type: DataTypes.STRING(150),
            allowNull: true,
        },
        token_publico: {
            type: DataTypes.UUID,
            allowNull: false,
            unique: true,
        },


    },
    {
        tableName: "evaluacion",
        hooks: {

            beforeValidate: (evaluacion) => {

                if (!evaluacion.token_publico) {

                    evaluacion.token_publico =

                        crypto.randomUUID();

                }

            }

        },
        timestamps: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
        freezeTableName: true,
    }
);


export default Evaluacion;