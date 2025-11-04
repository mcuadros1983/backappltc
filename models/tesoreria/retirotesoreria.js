import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const RetiroTesoreria = sequelize.define("RetiroTesoreria", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  fecha: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  importe: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
  sucursal_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  caja_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  movimiento_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  retiroSucursalId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  fecha_recepcion: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    defaultValue: DataTypes.NOW,
  },
}, {
  timestamps: false,
  freezeTableName: true,
});

export default RetiroTesoreria;