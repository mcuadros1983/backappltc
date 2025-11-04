// models/tesoreria/MovimientoCtaCteProveedor.js
import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const MovimientoCtaCteProveedor = sequelize.define("MovimientoCtaCteProveedor", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

  proveedor_id: { type: DataTypes.INTEGER, allowNull: false },
  empresa_id: { type: DataTypes.INTEGER, allowNull: true },

  fecha: { type: DataTypes.DATEONLY, allowNull: false },
  fecha_pago: { type: DataTypes.DATEONLY, allowNull: true },
  descripcion: { type: DataTypes.STRING, allowNull: true },

  // cargo = aumenta deuda (factura/ND) | abono = disminuye deuda (pago/NC)
  tipo: {
    type: DataTypes.ENUM("cargo", "abono"),
    allowNull: false
  },

  importe: { type: DataTypes.DECIMAL(12, 2), allowNull: false },

  // vínculo al origen
  origen_tipo: { type: DataTypes.STRING, allowNull: false }, // "ComprobanteEgreso" | "PagoTransferenciaBancaria" | "EgresoCaja" | "EcheqEmitido" | "NotaCredito" ...
  origen_id: { type: DataTypes.INTEGER, allowNull: false },

  // opcional: para conciliaciones/queries
  comprobanteegreso_id: { type: DataTypes.INTEGER, allowNull: true },
  // 🔹 NUEVOS CAMPOS
  anulado: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: false,
  },
  ordenpago_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  formapago_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  referencia_id: {          // id del modelo origen (OP, sueldo, etc.)
    type: DataTypes.INTEGER,
    allowNull: true,
  },

  referencia_tipo: {        // nombre del modelo origen
    type: DataTypes.STRING,
    allowNull: true,
  },

}, {
  tableName: "mov_ctacte_proveedor",
  timestamps: false,
  freezeTableName: true,
  indexes: [
    { fields: ["proveedor_id", "fecha"] },
    { fields: ["origen_tipo", "origen_id"] },
    { fields: ["comprobanteegreso_id"] },
  ],
});

export default MovimientoCtaCteProveedor;
