import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const CtaCteProveedor = sequelize.define("CtaCteProveedor", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  proveedor_id: {
    type: DataTypes.INTEGER,
    allowNull: false, // Relación obligatoria
  },
}, {
  timestamps: false,
  freezeTableName: true,
});

export default CtaCteProveedor;
