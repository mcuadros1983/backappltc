import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const AdicionalSueldo = sequelize.define("AdicionalSueldo", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  empleado_id: {
    type: DataTypes.INTEGER,
    allowNull: false, // Relación obligatoria con Empleado
  },
  sueldo_id: {
    type: DataTypes.INTEGER,
    allowNull: true, // Relación opcional con Sueldo
  },
  descripcion: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  monto: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
  sucursal_id: {
    type: DataTypes.INTEGER,
    allowNull: true, // Relación opcional
  },
}, {
  timestamps: false,
  freezeTableName: true,
});

export default AdicionalSueldo;
