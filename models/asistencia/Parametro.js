import { DataTypes, Model } from 'sequelize';
import { sequelize } from "../../config/database.js";

export class Parametro extends Model {}
Parametro.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  threshold_cosine: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0.62 },
  ventana_min_repeticion: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 5 },
  tz: { type: DataTypes.STRING(64), allowNull: false, defaultValue: 'America/Argentina/Cordoba' }
}, { sequelize, modelName: 'parametro', tableName: 'parametro', timestamps: true });
