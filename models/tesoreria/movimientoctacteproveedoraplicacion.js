// models/tesoreria/MovimientoCtaCteProveedorAplicacion.js
import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const MovCtaCteProvAplic = sequelize.define("MovCtaCteProvAplic", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

  empresa_id: { type: DataTypes.INTEGER, allowNull: false },
  proveedor_id: { type: DataTypes.INTEGER, allowNull: false },

  // FK a MovimientoCtaCteProveedor (tipo="abono")
  abono_id: { type: DataTypes.INTEGER, allowNull: false },

  // FK a MovimientoCtaCteProveedor (tipo="cargo")
  cargo_id: { type: DataTypes.INTEGER, allowNull: false },

  importe: { type: DataTypes.DECIMAL(12,2), allowNull: false },
}, {
  tableName: "mov_ctacte_proveedor_aplic",
  timestamps: false,
  freezeTableName: true,
  indexes: [
    { fields: ["empresa_id", "proveedor_id"] },
    { fields: ["abono_id"] },
    { fields: ["cargo_id"] },
  ],
});

export default MovCtaCteProvAplic;
