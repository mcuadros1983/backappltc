// models/AdicionalVariable.js  (carga mensual via Excel)
import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const AdicionalVariable = sequelize.define("AdicionalVariable", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    descripcion: { type: DataTypes.TEXT, allowNull: true },
    empleado_id: { type: DataTypes.INTEGER, allowNull: false },
    adicionalvariabletipo_id: { type: DataTypes.INTEGER, allowNull: true },
    periodo: { type: DataTypes.STRING, allowNull: false }, // "YYYY-MM"
    periodo_id: { type: DataTypes.INTEGER, allowNull: true },
    monto: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    observaciones: { type: DataTypes.TEXT, allowNull: true },
    fecha: {
        type: DataTypes.DATEONLY,
        allowNull: true,
    },
}, { timestamps: true });

export default AdicionalVariable;
