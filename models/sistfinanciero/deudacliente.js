import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const DeudaCliente = sequelize.define("DeudaCliente", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  estado: {
    type: DataTypes.ENUM("pendiente", "vencida", "pagada"),
    defaultValue: "pendiente",
  },
  montoPendiente: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
  fechaVencimiento: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
}, {
  timestamps: false,
  freezeTableName: true,
});

export default DeudaCliente;
