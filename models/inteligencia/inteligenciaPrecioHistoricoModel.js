import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

import InteligenciaSnapshot from "./inteligenciaSnapshotModel.js";
import ArticuloTabla from "../tablas/articuloModel.js";

const InteligenciaPrecioHistorico = sequelize.define(
  "InteligenciaPrecioHistorico",
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },

    snapshot_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },

    articulo_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },

    precio: {
      type: DataTypes.DECIMAL(14, 3),
      allowNull: false,
    },
  },
  {
    tableName: "inteligencia_precios_historicos",
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ["snapshot_id", "articulo_id"],
      },
      {
        fields: ["articulo_id"],
      },
    ],
  }
);

InteligenciaPrecioHistorico.belongsTo(
  InteligenciaSnapshot,
  {
    foreignKey: "snapshot_id",
    as: "snapshot",
    onDelete: "CASCADE",
  }
);

InteligenciaSnapshot.hasMany(
  InteligenciaPrecioHistorico,
  {
    foreignKey: "snapshot_id",
    as: "precios",
    onDelete: "CASCADE",
  }
);

InteligenciaPrecioHistorico.belongsTo(ArticuloTabla, {
  foreignKey: "articulo_id",
  as: "articulo",
});

export default InteligenciaPrecioHistorico;