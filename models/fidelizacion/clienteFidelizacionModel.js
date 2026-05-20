import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const ClienteFidelizacion = sequelize.define(
  "ClienteFidelizacion",
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },

    nombre: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },

    telefono: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },

    telefono_normalizado: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },

    estado: {
      type: DataTypes.ENUM("activo", "bloqueado", "sospechoso"),
      allowNull: false,
      defaultValue: "activo",
    },
  },
  {
    tableName: "clientes_fidelizacion",
    timestamps: true,
    indexes: [
      { fields: ["telefono_normalizado"] },
      { fields: ["estado"] },
    ],
  }
);

export default ClienteFidelizacion;