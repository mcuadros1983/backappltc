import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const Vale = sequelize.define(
  "Vale",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    caja_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    valeId: {
      type: DataTypes.BIGINT,
    },
    cliente_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    fecha: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    importecupon: {
      type: DataTypes.DECIMAL(12, 3),
      allowNull: false,
    },
    sucursal_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    venta_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    // tableName: "vale",
    timestamps: false,
    freezeTableName: true,
  }
);

export default Vale;