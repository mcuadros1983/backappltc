import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const MarcaTarjeta = sequelize.define("MarcaTarjeta", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  timestamps: false,
  freezeTableName: true,
});

export default MarcaTarjeta;