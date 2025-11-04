import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const ValeEmpleado = sequelize.define("ValeEmpleado", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  cajaId: {
    type: DataTypes.STRING,
    allowNull: true, // No tiene relación, es un valor
  },
  valeId: {
    type: DataTypes.STRING,
    allowNull: true, // No tiene relación, es un valor
  },
  empleado_id: {
    type: DataTypes.INTEGER,
    allowNull: true, // Relación opcional
  },
  fecha: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  importecupon: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
  sucursal_id: {
    type: DataTypes.INTEGER,
    allowNull: true, // Relación opcional
  },
  ventaId: {
    type: DataTypes.STRING,
    allowNull: true, // No tiene relación, es un valor
  },
  sueldo_id: {
    type: DataTypes.INTEGER,
    allowNull: true, // Relación opcional
  },
}, {
  timestamps: false,
  freezeTableName: true,
});

export default ValeEmpleado;
