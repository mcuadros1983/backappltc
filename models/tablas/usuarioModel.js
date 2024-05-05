import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const UsuarioTabla = sequelize.define(
    "UsuarioTabla",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            allowNull: false,
            autoIncrement: false, // Desactiva la auto-generación del id
        },
        contrasena: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        nombre_completo: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        nombre_usuario: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        id_grupo: {
            type: DataTypes.BIGINT,
            allowNull: false,
        },
    },
    {
        timestamps: false,
        freezeTableName: true,
    }
);

export default UsuarioTabla;
