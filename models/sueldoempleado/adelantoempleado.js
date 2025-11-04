// models/sueldoempleado/AdelantoEmpleado.js
import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const AdelantoEmpleado = sequelize.define("AdelantoEmpleado", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  empleado_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  monto: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  observaciones: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  fecha: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  formapago_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
}, {
  freezeTableName: true,
  timestamps: false,
});

export default AdelantoEmpleado;
