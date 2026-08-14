import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

import EvaluacionTipo from "./evaluacionTipoModel.js";
import Evaluacion from "./evaluacionModel.js";

const EvaluacionPlantilla = sequelize.define(
    "EvaluacionPlantilla",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },

        codigo: {
            type: DataTypes.STRING(30),
            allowNull: false,
            unique: true,
        },

        descripcion: {
            type: DataTypes.STRING(150),
            allowNull: false,
        },

        tipo_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },

        activo: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
        // plantilla_id: {
        //     type: DataTypes.INTEGER,
        //     allowNull: false,
        // },

    },
    {
        tableName: "evaluacion_plantilla",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
        freezeTableName: true,
    }
);


export default EvaluacionPlantilla;