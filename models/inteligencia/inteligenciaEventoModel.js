import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const InteligenciaEvento = sequelize.define(
  "InteligenciaEvento",
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },

    categoria: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },

    tipo: {
      type: DataTypes.STRING(80),
      allowNull: false,
    },

    nombre: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },

    fecha_desde: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    fecha_hasta: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },

    datos: {
      type: DataTypes.JSONB,
      allowNull: true,
    },

    observaciones: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    usuario_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },

    activo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    tableName: "inteligencia_eventos",
    timestamps: true,
    indexes: [
      {
        fields: ["fecha_desde", "fecha_hasta"],
      },
      {
        fields: ["categoria"],
      },
      {
        fields: ["tipo"],
      },
    ],
  }
);

export default InteligenciaEvento;