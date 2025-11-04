import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../../config/database.js';

export class Jornada extends Model {}
Jornada.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombre: { type: DataTypes.STRING(120), allowNull: false, unique: true },
  activo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
}, {
  sequelize,
  modelName: 'Jornada',
  tableName: 'jornada',
  freezeTableName: true,
  timestamps: false,
});
export default Jornada;
    