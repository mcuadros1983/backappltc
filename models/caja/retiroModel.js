import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const Retiro = sequelize.define(
  "Retiro",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    retiroId: {
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
      type: DataTypes.DATE,
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
    // tableName: "retiro",
    timestamps: false,
    freezeTableName: true,
  }
);

export default  Retiro;
