import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const PrestamoEmpleado = sequelize.define(
    "PrestamoEmpleado",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },

        numero: {
            type: DataTypes.STRING(50),
            allowNull: true,
            unique: true,
        },

        empleado_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },

        monto_original: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
        },

        saldo: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
        },

        fecha_otorgamiento: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },

        fecha_primer_descuento: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },

        estado: {
            type: DataTypes.STRING(20),
            allowNull: false,
            defaultValue: "pendiente",
            validate: {
                isIn: [[
                    "pendiente",
                    "activo",
                    "cancelado",
                    "anulado",
                ]],
            },
        },

        observaciones: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    },
    {
        timestamps: true,
    }
);

export default PrestamoEmpleado;