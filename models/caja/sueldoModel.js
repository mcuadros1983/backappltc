import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const Sueldo = sequelize.define(
  "Sueldo",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    sueldoId: {
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
    empleado_id: {
      type: DataTypes.INTEGER,
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
  },
  {
    // tableName: "sueldo",
    timestamps: false,
    freezeTableName: true,
  }
);

export default Sueldo;