import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const ProduccionLoteDetalle = sequelize.define(
  "ProduccionLoteDetalle",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    produccion_lote_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    articulo_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    cantidad: {
      type: DataTypes.DECIMAL(15, 3),
      allowNull: false,
    },

    observaciones: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    timestamps: true,
  }
);

export default ProduccionLoteDetalle;