import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const ComercioQr = sequelize.define(
  "ComercioQr",
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },

    comercio_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },

    token: {
      type: DataTypes.STRING(120),
      allowNull: false,
      unique: true,
    },

    url: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    estado: {
      type: DataTypes.ENUM("activo", "inactivo", "revocado"),
      allowNull: false,
      defaultValue: "activo",
    },

    fecha_generacion: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },

    fecha_baja: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "comercio_qrs",
    timestamps: true,
    indexes: [
      { unique: true, fields: ["token"] },
      { fields: ["comercio_id"] },
      { fields: ["estado"] },
    ],
  }
);

export default ComercioQr;