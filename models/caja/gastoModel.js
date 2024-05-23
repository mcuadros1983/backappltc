import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const Gasto = sequelize.define(
  "Gasto",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    gastoId: {
      type: DataTypes.BIGINT,
    },
    caja_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    descripcion: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    fecha: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    importe: {
      type: DataTypes.DECIMAL(12, 3),
      allowNull: false,
    },
    sucursal_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    tipodegasto_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    // tableName: "gasto",
    timestamps: false,
    freezeTableName: true,
  }
);

export default Gasto;
