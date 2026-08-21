
import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const MovimientoCajaTesoreria = sequelize.define("MovimientoCajaTesoreria", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  tipo: {
    type: DataTypes.ENUM("ingreso", "egreso"),
    allowNull: false
  },
  descripcion: {
    type: DataTypes.STRING,
    allowNull: false
  },
  monto: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  fecha: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  caja_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  formapago_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  referencia_id: {
    type: DataTypes.INTEGER, // id del modelo origen (adelanto, sueldo, etc.)
    allowNull: true,
  },
  referencia_tipo: {
    type: DataTypes.STRING, // nombre del modelo origen
    allowNull: true,
  },
  observaciones: {
    type: DataTypes.TEXT,
    allowNull: true,
  },  // 🔹 NUEVOS CAMPOS
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
  categoriaingreso_id: { type: DataTypes.INTEGER, allowNull: true },

  imputacioncontable_id: { type: DataTypes.INTEGER, allowNull: true },

  // Idempotencia (opcional recomendado)
  idempotency_key: { type: DataTypes.STRING, allowNull: true, unique: true },
  proyecto_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  proveedor_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },

  comprobanteegreso_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },

}, {
  tableName: "movimiento_caja_tesoreria",
  timestamps: false,
});

export default MovimientoCajaTesoreria; 
