import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const PagoTransferenciaBancaria = sequelize.define("PagoTransferenciaBancaria", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

  // Vínculos
  comprobanteegreso_id: { type: DataTypes.INTEGER, allowNull: true }, // egreso que se salda (total/parcial)
  proveedor_id: { type: DataTypes.INTEGER, allowNull: true },
  empresa_id: { type: DataTypes.INTEGER, allowNull: true },

  // Banco y fechas
  fecha_orden: { type: DataTypes.DATEONLY, allowNull: false }, // fecha en que das la instrucción
  fecha_acreditacion: { type: DataTypes.DATEONLY, allowNull: true },  // cuando impacta (si es inmediata, igual a fecha_orden)

  // Importe
  importe: { type: DataTypes.DECIMAL(12, 2), allowNull: false },

  // Cuentas
  banco_id: { type: DataTypes.INTEGER, allowNull: false },  // tu cuenta
  //banco_destino_id:    { type: DataTypes.INTEGER, allowNull: true },   // cuenta del proveedor (si la tenés parametrizada)
  cbu_alias_destino: { type: DataTypes.STRING, allowNull: true },    // CBU o alias destino
  titular_destino: { type: DataTypes.STRING, allowNull: true },    // por si querés guardar el nombre

  // Trazabilidad
  referencia_externa: { type: DataTypes.STRING, allowNull: true },    // N° operación del banco
  concepto: { type: DataTypes.STRING, allowNull: true },
  observaciones: { type: DataTypes.TEXT, allowNull: true },

  // Estado de la instrucción
  estado: {
    type: DataTypes.ENUM("pendiente", "enviada", "acreditada", "rechazada", "revertida"),
    defaultValue: "acreditada",
  },
  // 🔹 NUEVOS CAMPOS
  anulado: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  ordenpago_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
}, {
  tableName: "pago_transferencia_bancaria",
  timestamps: false,
  freezeTableName: true,
});

export default PagoTransferenciaBancaria;
