import { DataTypes, Model } from 'sequelize';
import { sequelize } from "../../config/database.js";

export class EmpleadoEmbedding extends Model {}

EmpleadoEmbedding.init({
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  empleado_id: { type: DataTypes.INTEGER, allowNull: false },
  // Guardamos embedding como JSONB (lista de floats). Alternativa: BYTEA con pack Float32.
  vector: { type: DataTypes.JSONB, allowNull: false },
  dim: { type: DataTypes.SMALLINT, allowNull: false, defaultValue: 128 }, // o 512 según el modelo
  fuente: { type: DataTypes.STRING, allowNull: false, defaultValue: 'mobile' }, // 'mobile','admin','import'
  activo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true }
}, {
  sequelize,
  modelName: 'empleado_embedding',
  tableName: 'empleado_embedding',
  indexes: [
    { fields: ['empleado_id', 'activo'] }
  ]
});
