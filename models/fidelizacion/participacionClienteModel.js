import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const ParticipacionCliente = sequelize.define(
  "ParticipacionCliente",
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },

    cliente_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },

    comercio_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },

    campania_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },

    premio_cliente_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },

    cupon_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },

    resultado: {
      type: DataTypes.ENUM("gano", "siga_participando", "bloqueado", "error"),
      allowNull: false,
    },

    estado: {
      type: DataTypes.ENUM("permitida", "bloqueada", "sospechosa", "procesada"),
      allowNull: false,
    },

    motivo_bloqueo: {
      type: DataTypes.ENUM(
        "qr_invalido",
        "comercio_inactivo",
        "campania_inactiva",
        "gps_denegado",
        "fuera_de_rango",
        "telefono_repetido",
        "device_repetido",
        "limite_diario",
        "premios_agotados",
        "fraude_sospechado",
        "error_interno"
      ),
      allowNull: true,
    },

    device_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },

    ip: {
      type: DataTypes.STRING(80),
      allowNull: true,
    },

    user_agent: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    lat_cliente: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: true,
    },

    lon_cliente: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: true,
    },

    precision_gps: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },

    distancia_metros: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },

    telefono_ingresado: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },

    nombre_ingresado: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },

    fecha_participacion: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "participaciones_cliente",
    timestamps: true,
    indexes: [
      { fields: ["comercio_id"] },
      { fields: ["cliente_id"] },
      { fields: ["campania_id"] },
      { fields: ["device_id"] },
      { fields: ["fecha_participacion"] },
      { fields: ["resultado"] },
      { fields: ["estado"] },
    ],
  }
);

export default ParticipacionCliente;