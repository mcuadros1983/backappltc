import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const ConciliacionRubro = sequelize.define("ConciliacionRubro", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  descripcion: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  timestamps: false,
  freezeTableName: true,
});

export default ConciliacionRubro;
