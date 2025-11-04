import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const CierreZIva = sequelize.define("CierreZIva", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  fecha: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  sucursal_id: {
    type: DataTypes.INTEGER,
    allowNull: true, // Relación opcional
  },
  neto: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
  iva21: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
  iva105: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
  total: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
  nrocierre: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, {
  timestamps: false,
  freezeTableName: true,
});

export default CierreZIva;
