// models/tesoreria/MovimientoCtaCteProveedor.js
import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const MovimientoCtaCteCliente = sequelize.define("MovimientoCtaCteCliente", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

  cliente_id: { type: DataTypes.INTEGER, allowNull: false },
  empresa_id: { type: DataTypes.INTEGER, allowNull: true },

  fecha: { type: DataTypes.DATEONLY, allowNull: false },
  fecha_cobro: { type: DataTypes.DATEONLY, allowNull: true },
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
  comprobanteingreso_id: { type: DataTypes.INTEGER, allowNull: true },
  // 🔹 NUEVOS CAMPOS
  anulado: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: false,
  },
  ordencobro_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
}, {
  tableName: "mov_ctacte_cliente",
  timestamps: false,
  freezeTableName: true,
  indexes: [
    { fields: ["cliente_id", "fecha"] },
    { fields: ["origen_tipo", "origen_id"] },
    { fields: ["comprobanteingreso_id"] },
  ],
});

export default MovimientoCtaCteCliente;
