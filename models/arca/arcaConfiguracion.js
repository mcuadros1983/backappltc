import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const ArcaConfiguracion = sequelize.define("ArcaConfiguracion", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  empresa_id: { type: DataTypes.INTEGER, allowNull: false },
  ambiente: { type: DataTypes.STRING(20), allowNull: false, validate: { isIn: [["homologacion", "produccion"]] } },
  credenciales_ref: { type: DataTypes.STRING(64), allowNull: false },
  punto_venta: { type: DataTypes.INTEGER, allowNull: true },
  activa: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
}, {
  tableName: "arca_configuracion",
  timestamps: true,
  indexes: [{ unique: true, fields: ["empresa_id", "ambiente"] }],
});

export default ArcaConfiguracion;
