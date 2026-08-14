import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const InteligenciaClima = sequelize.define(
  "InteligenciaClima",
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },

    fecha: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      unique: true,
    },

    temperatura_min: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: true,
    },

    temperatura_max: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: true,
    },

    temperatura_media: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: true,
    },

    precipitacion_mm: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: true,
    },

    viento_max_kmh: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: true,
    },

    codigo_clima: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    fuente: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: "OPEN_METEO",
    },
  },
  {
    tableName: "inteligencia_clima",
    timestamps: true,

    indexes: [
      {
        unique: true,
        fields: ["fecha"],
      },
    ],
  }
);

export default InteligenciaClima;