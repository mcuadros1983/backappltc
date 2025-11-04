import { DataTypes, Model } from 'sequelize';
import { sequelize } from "../../config/database.js";

export class Dispositivo extends Model {}
Dispositivo.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombre: { type: DataTypes.STRING(120), allowNull: false },
  device_id: { type: DataTypes.STRING(160), allowNull: false, unique: true },
  api_key: { type: DataTypes.STRING(160), allowNull: false },
  sucursal_id: { type: DataTypes.INTEGER, allowNull: false },
  enabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  last_seen: { type: DataTypes.DATE, allowNull: true }
}, { sequelize, modelName: 'dispositivo', tableName: 'dispositivo', timestamps: true });
