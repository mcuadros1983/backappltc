import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const CtaCteCliente = sequelize.define("CtaCteCliente", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  cliente_id: {
    type: DataTypes.INTEGER,
    allowNull: false, // Relación obligatoria
  },
}, {
  timestamps: false,
  freezeTableName: true,
});

export default CtaCteCliente;
