import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const LibroIVA = sequelize.define("LibroIVA", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  mes: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  anio: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  empresa_id: {
    type: DataTypes.INTEGER,
    allowNull: true, // Si está en modo unificado, puede ser null
  },
}, {
  timestamps: false,
  freezeTableName: true,
});

export default LibroIVA;
