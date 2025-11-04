import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const Banco = sequelize.define("Banco", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  descripcion: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  cuenta: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  alias: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  empresa_id: { type: DataTypes.INTEGER, allowNull: true },
}, {
  timestamps: false,
  freezeTableName: true,
});

export default Banco;