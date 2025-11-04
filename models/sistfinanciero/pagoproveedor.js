import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const PagoProveedor = sequelize.define("PagoProveedor", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  fecha: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  monto: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
  observaciones: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  estado: {
    type: DataTypes.ENUM("pendiente", "vencida", "pagada"),
    defaultValue: "pendiente",
  },
  registrohacienda_id: {
    type: DataTypes.INTEGER,
    allowNull: false, // Relación obligatoria
  },
}, {
  timestamps: false,
  freezeTableName: true,
});

export default PagoProveedor;
