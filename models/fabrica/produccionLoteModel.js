import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const ProduccionLote = sequelize.define(
  "ProduccionLote",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    numero_lote: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: true,
    },

    fecha_produccion: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    fecha_vencimiento: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },

    estado: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "CONFIRMADO",
    },

    observaciones: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    empresa_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    cantidad_productos: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },

    total_kg: {
      type: DataTypes.DECIMAL(15, 3),
      defaultValue: 0,
    },
  },
  {
    timestamps: true,
  }
);

export default ProduccionLote;