import { DataTypes, Model } from 'sequelize';
import { sequelize } from "../../config/database.js";

export class Asistencia extends Model {}
Asistencia.init({
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  empleado_id: { type: DataTypes.INTEGER, allowNull: false },
  sucursal_id: { type: DataTypes.INTEGER, allowNull: false },
  device_id: { type: DataTypes.STRING(160), allowNull: false },
  metodo: { type: DataTypes.STRING(32), allowNull: false, defaultValue: 'facial' },
  score: { type: DataTypes.FLOAT, allowNull: false },
  liveness_passed: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  ts_utc: { type: DataTypes.DATE, allowNull: false },
  lat: { type: DataTypes.DOUBLE, allowNull: true },
  lon: { type: DataTypes.DOUBLE, allowNull: true },
  estado: { type: DataTypes.STRING(24), allowNull: true }, // on_time | late ...
  idempotency_key: { type: DataTypes.STRING(120), allowNull: true, unique: true },
    // 👇 Nuevo campo equivalente al de Django
  operation_concept: { 
    type: DataTypes.ENUM('INGRESO', 'EGRESO'),
    allowNull: false,
    defaultValue: 'INGRESO'
  }
}, { sequelize, modelName: 'asistencia', tableName: 'asistencia', timestamps: true });
