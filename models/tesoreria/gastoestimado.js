import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const GastoEstimado = sequelize.define("GastoEstimado", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

  empresa_id: { type: DataTypes.INTEGER, allowNull: true },
  proveedor_id: { type: DataTypes.INTEGER, allowNull: true },
  categoriaegreso_id: { type: DataTypes.INTEGER, allowNull: true },

  descripcion: { type: DataTypes.STRING, allowNull: false },

  periodicidad: {
    type: DataTypes.ENUM("mensual", "bimestral", "trimestral", "anual", "unico"),
    allowNull: false,
    defaultValue: "mensual",
  },
  dia_vencimiento_default: { type: DataTypes.INTEGER, allowNull: true }, // 1..31
  monto_estimado_default: { type: DataTypes.DECIMAL(12,2), allowNull: true },

  sucursal_id: { type: DataTypes.INTEGER, allowNull: true },
  tipocomprobante_id: { type: DataTypes.INTEGER, allowNull: true },
  formapago_id: { type: DataTypes.INTEGER, allowNull: true },

  requiere_factura: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false },

  activo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  observaciones: { type: DataTypes.TEXT, allowNull: true },
}, {
  tableName: "gasto_estimado",
  timestamps: false,
});

export default GastoEstimado;
