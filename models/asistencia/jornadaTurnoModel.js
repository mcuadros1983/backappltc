import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../../config/database.js';

export class JornadaTurno extends Model {}
JornadaTurno.init({
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },

  jornada_id: { type: DataTypes.INTEGER, allowNull: false },
  turno_id:   { type: DataTypes.INTEGER, allowNull: false },

  // Metadatos útiles:
  dia_semana: {                   // 0=Dom, 1=Lun, ... 6=Sáb (nullable si la jornada no distingue por día)
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: { min: 0, max: 6 },
  },
  orden: { type: DataTypes.INTEGER, allowNull: true }, // orden visual / de evaluación

  vigente_desde: { type: DataTypes.DATE, allowNull: true },
  vigente_hasta: { type: DataTypes.DATE, allowNull: true },

  activo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
}, {
  sequelize,
  modelName: 'JornadaTurno',
  tableName: 'jornada_turno',
  freezeTableName: true,
  timestamps: true,
  indexes: [
    // Unicidad por combinación. Si usas dia_semana, la unicidad incluye ese campo; si no lo usas, puede quedar null.
    { unique: true, fields: ['jornada_id', 'turno_id', 'dia_semana'] },
    { fields: ['jornada_id'] },
    { fields: ['turno_id'] },
    { fields: ['activo'] },
  ],
});
export default JornadaTurno;
