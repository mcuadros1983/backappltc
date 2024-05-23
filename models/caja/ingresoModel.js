import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const Ingreso = sequelize.define(
  "Ingreso",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    ingresoId: {
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
    dtype: {
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
    tipodeingreso_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    // tableName: "ingreso",
    timestamps: false,
    freezeTableName: true,
  }
);

export default Ingreso