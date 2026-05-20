import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const CampaniaFidelizacion = sequelize.define(
  "CampaniaFidelizacion",
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

    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    fecha_inicio: {
      type: DataTypes.DATE,
      allowNull: false,
    },

    fecha_fin: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    estado: {
      type: DataTypes.ENUM(
        "borrador",
        "activa",
        "pausada",
        "finalizada",
        "cancelada"
      ),
      allowNull: false,
      defaultValue: "borrador",
    },

    prioridad: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },

    tipo: {
      type: DataTypes.ENUM(
        "general",
        "por_comercio",
        "por_sucursal",
        "por_zona",
        "evento_especial"
      ),
      allowNull: false,
      defaultValue: "general",
    },

    created_by: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },

    updated_by: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
  },
  {
    tableName: "campanias_fidelizacion",
    timestamps: true,
    indexes: [
      { fields: ["estado"] },
      { fields: ["fecha_inicio"] },
      { fields: ["fecha_fin"] },
      { fields: ["prioridad"] },
    ],
  }
);

export default CampaniaFidelizacion;