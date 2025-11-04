import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const ConciliacionCriterio = sequelize.define("ConciliacionCriterio", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  operacion: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  criterio: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  rubro_id: {
    type: DataTypes.INTEGER,
    allowNull: false, // Relación obligatoria
  },
}, {
  timestamps: false,
  freezeTableName: true,
});

export default ConciliacionCriterio;
