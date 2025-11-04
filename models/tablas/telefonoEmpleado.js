// src/models/TelefonoEmpleado.js
import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js"; 
import EmpleadoTabla from "./empleadoModel.js"; // asegúrate que la ruta sea correcta

const TelefonoEmpleado = sequelize.define(
    "TelefonoEmpleado",
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        empleado_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: EmpleadoTabla, // referencia al modelo empleado
                key: "id",
            },
        },
        numero: {
            type: DataTypes.STRING(30),
            allowNull: false,
            // Ejemplos de validaciones opcionales:
            validate: {
                notEmpty: { msg: "El número no puede estar vacío" },
                // Permite +, espacios, -, () y dígitos; ajustalo a tu gusto
                is: {
                    args: [/^[+()\-.\s0-9]+$/],
                    msg: "El formato del teléfono no es válido",
                },
            },
        },
        // Si querés distinguir tipos: móvil, fijo, etc. (opcional)
        tipo: {
            type: DataTypes.ENUM("movil", "fijo", "otro"),
            allowNull: true,
        },
    },
    {
        tableName: "telefonosempleado", // nombre de tabla (personalizable)
        timestamps: false,
        freezeTableName: true,
        indexes: [
            { fields: ["empleado_id"] },
        ],
    }
);

// ===== Asociaciones (1:N) =====
EmpleadoTabla.hasMany(TelefonoEmpleado, {
    foreignKey: "empleado_id",
    as: "telefonos",
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
});

TelefonoEmpleado.belongsTo(EmpleadoTabla, {
    foreignKey: "empleado_id",
    as: "empleado",
});

export default TelefonoEmpleado;
