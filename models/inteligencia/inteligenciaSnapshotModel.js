import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const InteligenciaSnapshot = sequelize.define(
  "InteligenciaSnapshot",
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },

    fecha: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    observaciones: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    usuario_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
  },
  {
    tableName: "inteligencia_snapshots",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["fecha"],
      },
    ],
  }
);

export default InteligenciaSnapshot;