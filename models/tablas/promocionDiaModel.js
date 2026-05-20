import { DataTypes } from "sequelize";
import {sequelize} from "../../config/database.js";

import PromocionTabla from "./promocionModel.js";

const PromocionDiaTabla = sequelize.define(
  "PromocionDiaTabla",
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
    dia_semana: {
      type: DataTypes.INTEGER,
      allowNull: false,
      // 1 = lunes ... 7 = domingo
    },
  },
  {
    tableName: "promocion_dias",
    timestamps: false,
  }
);

// Relaciones
PromocionDiaTabla.belongsTo(PromocionTabla, {
  foreignKey: "promocion_id",
});

PromocionTabla.hasMany(PromocionDiaTabla, {
  foreignKey: "promocion_id",
});

export default PromocionDiaTabla;