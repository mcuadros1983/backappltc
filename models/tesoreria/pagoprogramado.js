import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const PagoProgramado = sequelize.define(
  "PagoProgramado",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    empresa_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    proveedor_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    fecha: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    fecha_pago: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    importe: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },

    descripcion: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    observaciones: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    // egreso_varios | anticipo_proveedor
    tipo_operacion: {
      type: DataTypes.ENUM(
        "egreso_varios",
        "anticipo_proveedor"
      ),
      allowNull: false,
    },

    // caja | banco
    medio: {
      type: DataTypes.ENUM(
        "caja",
        "banco"
      ),
      allowNull: false,
    },

    // Destino que se utilizará al acreditar
    caja_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    banco_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    formapago_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    categoriaegreso_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    imputacioncontable_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    proyecto_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    // OP creada al programar el pago
    ordenpago_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    /*
      Para anticipo_proveedor:
      identifica el ABONO creado en la cuenta corriente.
    */
    mov_ctacte_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    /*
      Si posteriormente se asocia a un comprobante,
      conservamos esa relación.
    */
    comprobanteegreso_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    // pendiente | acreditado | anulado
    estado: {
      type: DataTypes.ENUM(
        "pendiente",
        "acreditado",
        "anulado"
      ),
      allowNull: false,
      defaultValue: "pendiente",
    },

    /*
      Cuando se acredita indicamos qué movimiento REAL
      se creó.
    */
    movimiento_tipo: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    movimiento_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    fecha_acreditacion: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },

    idempotency_key: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
  },
  {
    tableName: "pago_programado",
    timestamps: false,
    freezeTableName: true,

    indexes: [
      { fields: ["empresa_id", "estado"] },
      { fields: ["proveedor_id"] },
      { fields: ["ordenpago_id"] },
      { fields: ["comprobanteegreso_id"] },
      { fields: ["fecha_pago"] },
    ],
  }
);

export default PagoProgramado;