import { DataTypes, Model } from 'sequelize';
import { sequelize } from "../../config/database.js";

export class Asistencia extends Model {}

Asistencia.init({
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  empleado_id: { type: DataTypes.INTEGER, allowNull: false },
  sucursal_id: { type: DataTypes.INTEGER, allowNull: false },
  device_id: { type: DataTypes.STRING(160), allowNull: true },
  metodo: { type: DataTypes.STRING(32), allowNull: false, defaultValue: 'facial' },
  score: { type: DataTypes.FLOAT, allowNull: true },
  liveness_passed: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: true },
  ts_utc: { type: DataTypes.DATE, allowNull: false },
  lat: { type: DataTypes.DOUBLE, allowNull: true },
  lon: { type: DataTypes.DOUBLE, allowNull: true },
  estado: { type: DataTypes.STRING(24), allowNull: true },
  idempotency_key: { type: DataTypes.STRING(150), allowNull: true, unique: true },
  operation_concept: {
    type: DataTypes.ENUM('INGRESO', 'EGRESO'),
    allowNull: false,
    defaultValue: 'INGRESO'
  }
}, {
  sequelize,
  modelName: 'asistencia',
  tableName: 'asistencia',
  timestamps: true
});
 
