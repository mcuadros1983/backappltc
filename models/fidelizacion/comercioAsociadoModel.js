import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const ComercioAsociado = sequelize.define(
  "ComercioAsociado",
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },

    nombre_fantasia: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },

    razon_social: {
      type: DataTypes.STRING(180),
      allowNull: true,
    },

    documento_tipo: {
      type: DataTypes.ENUM("CUIT", "DNI", "OTRO"),
      allowNull: false,
      defaultValue: "CUIT",
    },

    documento_numero: {
      type: DataTypes.STRING(30),
      allowNull: false,
    },

    domicilio: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },

    telefono: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },

    email: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },

    lat: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: false,
    },

    lon: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: false,
    },

    radio_metros: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 80,
    },

    estado: {
      type: DataTypes.ENUM(
        "activo",
        "inactivo",
        "suspendido",
        "bloqueado",
        "pendiente"
      ),
      allowNull: false,
      defaultValue: "activo",
    },

    habilitado: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },

    permite_multiples_participaciones: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },

    limite_participaciones_diarias: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },

    limite_premios_diarios: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    observaciones: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    created_by: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },

    updated_by: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
  },
  {
    tableName: "comercios_asociados",
    timestamps: true,
    indexes: [
      { fields: ["documento_numero"] },
      { fields: ["estado"] },
      { fields: ["habilitado"] },
    ],
  }
);

export default ComercioAsociado;