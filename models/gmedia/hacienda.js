import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const Hacienda = sequelize.define(
  "Hacienda",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    fecha: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    monto: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    proveedor_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    empresa_id: { type: DataTypes.INTEGER, allowNull: false },        // 👈 común
    frigorifico_id: { type: DataTypes.INTEGER, allowNull: false },     // 👈 común
    comprobante_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    observaciones: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    anulado: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    timestamps: false,
    freezeTableName: true,
  }
);

export default Hacienda;
