// models/tesoreria/EgresoCaja.js
import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const EgresoCaja = sequelize.define("EgresoCaja", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

  descripcion: { type: DataTypes.STRING, allowNull: false },
  monto: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  fecha: { type: DataTypes.DATEONLY, allowNull: false },

  caja_id: { type: DataTypes.INTEGER, allowNull: false },
  categoriaegreso_id: { type: DataTypes.INTEGER, allowNull: false },
  formapago_id: { type: DataTypes.INTEGER, allowNull: true },   // efectivo, caja chica, etc.
  empresa_id: { type: DataTypes.INTEGER, allowNull: true },
  proveedor_id: { type: DataTypes.INTEGER, allowNull: true },   // útil para reportes

  // vínculo polimórfico al origen del egreso
  origen_tipo: { type: DataTypes.STRING, allowNull: false },     // "ComprobanteEgreso" | "PagoSueldo" | ...
  origen_id: { type: DataTypes.INTEGER, allowNull: false },

  observaciones: { type: DataTypes.STRING, allowNull: true },
}, {
  timestamps: false,
  freezeTableName: true,
  tableName: "egreso_caja",
  indexes: [
    { fields: ["caja_id", "fecha"] },
    { fields: ["origen_tipo", "origen_id"] },
    { fields: ["categoriaegreso_id"] },
  ],
});

export default EgresoCaja;

