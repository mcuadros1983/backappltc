import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const EcheqEmitido = sequelize.define("EcheqEmitido", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

  // Vínculos
  comprobanteegreso_id: { type: DataTypes.INTEGER, allowNull: true },
  proveedor_id: { type: DataTypes.INTEGER, allowNull: true },
  empresa_id: { type: DataTypes.INTEGER, allowNull: true },

  // Datos del eCheq
  numero_echeq: { type: DataTypes.STRING, allowNull: true },     // ID/UUID del eCheq
  banco_id: { type: DataTypes.INTEGER, allowNull: false },   // tu banco
  //  cuit_emisor:          { type: DataTypes.STRING, allowNull: true },     // por trazabilidad
  //cuit_beneficiario:    { type: DataTypes.STRING, allowNull: true },     // proveedor

  // Fechas e importe
  fecha_emision: { type: DataTypes.DATEONLY, allowNull: false },
  fecha_vencimiento: { type: DataTypes.DATEONLY, allowNull: false },  // puede ser hoy o futura
  importe: { type: DataTypes.DECIMAL(12, 2), allowNull: false },

  // Estado ciclo vida eCheq
  estado: {
    type: DataTypes.ENUM(
      "emitido",      // creado/emitido
      "entregado",    // endosado/entregado al proveedor
      "presentado",   // presentado para su cobro
      "acreditado",   // debitado de tu cuenta (impacta banco)
      "rechazado",
      "anulado"
    ),
    defaultValue: "emitido",
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
  // Para derivar imputación contable automática
  categoriaegreso_id: { type: DataTypes.INTEGER, allowNull: true },
  imputacioncontable_id: { type: DataTypes.INTEGER, allowNull: true },
  proyecto_id: { type: DataTypes.INTEGER, allowNull: true },
    referencia_id: {          // id del modelo origen (OP, sueldo, etc.)
    type: DataTypes.INTEGER,
    allowNull: true,
  },

  referencia_tipo: {        // nombre del modelo origen
    type: DataTypes.STRING,
    allowNull: true,
  },

}, {
  tableName: "echeq_emitido",
  timestamps: false,
  freezeTableName: true,
});

export default EcheqEmitido;
