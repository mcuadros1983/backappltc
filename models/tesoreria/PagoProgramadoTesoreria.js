import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const PagoProgramadoTesoreria = sequelize.define(
  "PagoProgramadoTesoreria",
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
      allowNull: false,
    },

    // egreso_varios | anticipo
    tipo: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    // caja | banco
    medio: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    fecha_programada: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    monto: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },

    descripcion: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    observaciones: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    // Forma de pago que se estableció para el futuro
    formapago_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    // Banco previsto si medio=banco
    banco_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    // Caja prevista si medio=caja
    caja_id: {
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

    // Se completa si el compromiso se aplica a un comprobante
    comprobanteegreso_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    // OP asociada
    ordenpago_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    // Si es anticipo, ABONO creado en Cta.Cte.
    movimiento_ctacte_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    // pendiente | acreditado | anulado
    estado: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "pendiente",
    },

    fecha_acreditacion: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },

    // Movimiento real generado al acreditar
    movimiento_tipo: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    movimiento_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    idempotency_key: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
  },
  {
    tableName: "pago_programado_tesoreria",
    timestamps: false,
    freezeTableName: true,

    indexes: [
      {
        fields: ["empresa_id", "proveedor_id"],
      },
      {
        fields: ["estado", "fecha_programada"],
      },
      {
        fields: ["comprobanteegreso_id"],
      },
    ],
  }
);

export default PagoProgramadoTesoreria;