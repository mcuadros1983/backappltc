import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const GastoEstimadoPago = sequelize.define("GastoEstimadoPago", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

  gastoestimado_instancia_id: { type: DataTypes.INTEGER, allowNull: false },

  referencia_tipo: { type: DataTypes.STRING, allowNull: false }, // MovimientoBancoTesoreria, etc
  referencia_id:   { type: DataTypes.INTEGER, allowNull: false },

  formapago_id: { type: DataTypes.INTEGER, allowNull: true },

  fecha_aplicacion: { type: DataTypes.DATEONLY, allowNull: false },
  monto_aplicado:   { type: DataTypes.DECIMAL(12,2), allowNull: false },

  observaciones: { type: DataTypes.TEXT, allowNull: true },
}, {
  tableName: "gasto_estimado_pago",
  timestamps: false,
  indexes: [{ fields: ["gastoestimado_instancia_id"] }],
});

export default GastoEstimadoPago;
