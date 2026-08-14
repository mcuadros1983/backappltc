import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const MotorConceptoListaItem = sequelize.define("MotorConceptoListaItem", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  lista_id: { type: DataTypes.INTEGER, allowNull: false },
  valor: { type: DataTypes.STRING(120), allowNull: false },
  etiqueta: { type: DataTypes.STRING(150), allowNull: false },
  color: { type: DataTypes.STRING(20), allowNull: true },
  orden: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  activo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
}, {
  tableName: "motor_concepto_lista_items",
  underscored: true,
  paranoid: true,
  indexes: [
    { unique: true, fields: ["lista_id", "valor"], name: "uq_motor_concepto_lista_items_valor" },
    { fields: ["lista_id", "orden"], name: "ix_motor_concepto_lista_items_orden" },
  ],
});

export default MotorConceptoListaItem;
