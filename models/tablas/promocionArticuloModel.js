import { DataTypes } from "sequelize";
import {sequelize} from "../../config/database.js";

import PromocionTabla from "./promocionModel.js";
import ArticuloTabla from "./articuloModel.js";

const PromocionArticuloTabla = sequelize.define(
  "PromocionArticuloTabla",
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    promocion_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    articulo_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    valor: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
  },
  {
    tableName: "promocion_articulos",
    timestamps: false,
  }
);

PromocionArticuloTabla.belongsTo(PromocionTabla, {
  foreignKey: "promocion_id",
});

PromocionArticuloTabla.belongsTo(ArticuloTabla, {
  foreignKey: "articulo_id",
});

PromocionTabla.hasMany(PromocionArticuloTabla, {
  foreignKey: "promocion_id",
});

ArticuloTabla.hasMany(PromocionArticuloTabla, {
  foreignKey: "articulo_id",
});

export default PromocionArticuloTabla;