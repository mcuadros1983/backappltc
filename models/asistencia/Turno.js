import { DataTypes, Model } from 'sequelize';
import { sequelize } from "../../config/database.js";

export class Turno extends Model {}
Turno.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombre: { type: DataTypes.STRING(120), allowNull: false },
  hora_entrada: { type: DataTypes.STRING(5), allowNull: false }, // "08:00"
  hora_salida: { type: DataTypes.STRING(5), allowNull: false },
  tolerancia_min: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 }
}, { sequelize, modelName: 'turno', tableName: 'turno', timestamps: true });
