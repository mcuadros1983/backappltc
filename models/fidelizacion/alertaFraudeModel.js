import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const AlertaFraude = sequelize.define(
  "AlertaFraude",
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },

    participacion_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },

    cliente_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },

    comercio_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },

    tipo_alerta: {
      type: DataTypes.ENUM(
        "telefono_repetido",
        "device_repetido",
        "fuera_de_rango",
        "gps_invalido",
        "multiples_telefonos_mismo_device",
        "multiples_devices_misma_ip",
        "participacion_bloqueada",
        "uso_masivo_qr",
        "intentos_repetidos",
        "otro"
      ),
      allowNull: false,
      defaultValue: "otro",
    },

    nivel_riesgo: {
      type: DataTypes.ENUM("bajo", "medio", "alto", "critico"),
      allowNull: false,
      defaultValue: "bajo",
    },

    descripcion: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    estado: {
      type: DataTypes.ENUM("pendiente", "en_revision", "resuelta", "descartada"),
      allowNull: false,
      defaultValue: "pendiente",
    },

    resuelto_por: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },

    fecha_resolucion: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    observaciones_resolucion: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "alertas_fraude",
    timestamps: true,
    indexes: [
      { fields: ["participacion_id"] },
      { fields: ["cliente_id"] },
      { fields: ["comercio_id"] },
      { fields: ["tipo_alerta"] },
      { fields: ["nivel_riesgo"] },
      { fields: ["estado"] },
      { fields: ["createdAt"] },
    ],
  }
);

export default AlertaFraude;