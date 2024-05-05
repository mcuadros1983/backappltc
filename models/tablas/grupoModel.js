import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const GrupoTabla = sequelize.define(
    "GrupoTabla",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            allowNull: false,
            autoIncrement: false, // Desactiva la auto-generación del id
        },
        descripcion: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        nombre: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
    },
    {
        timestamps: false,
        freezeTableName: true,
    }
);

export default GrupoTabla;
