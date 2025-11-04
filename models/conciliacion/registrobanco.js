import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const ConciliacionRegistroBanco = sequelize.define("ConciliacionRegistroBanco", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  descripcion: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  banco_id: {
    type: DataTypes.INTEGER,
    allowNull: false, // Relación obligatoria
  },
  empresa_id: {
    type: DataTypes.INTEGER,
    allowNull: false, // Relación obligatoria
  },
  rubro_id: {
    type: DataTypes.INTEGER,
    allowNull: false, // Relación obligatoria
  },
  cuenta_id: {
    type: DataTypes.INTEGER,
    allowNull: false, // Relación obligatoria
  },
  fecha: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  monto: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
}, {
  timestamps: false,
  freezeTableName: true,
});

export default ConciliacionRegistroBanco;
