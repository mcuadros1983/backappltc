import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const Compra = sequelize.define("Compra", {
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
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  tipoPago: {
    type: DataTypes.ENUM("efectivo", "cuenta corriente"),
    allowNull: false,
  },
  estadoPago: {
    type: DataTypes.ENUM("pagada", "impaga", "parcial"),
    defaultValue: "impaga",
  },
  fechaVencimiento: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  conFactura: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  timestamps: false,
  freezeTableName: true,
});

export default Compra;
