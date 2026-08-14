import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const Inspeccion = sequelize.define(
  "Inspeccion",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    plantilla_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    sucursal_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    usuario_inspector_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    fecha_inspeccion: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    estado: {
      type: DataTypes.ENUM(
        "ABIERTA",
        "PARCIAL",
        "CERRADA",
        "ANULADA",
      ),
      defaultValue: "ABIERTA",
    },

    puntaje: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },

    observacion_general: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    fecha_cierre: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    empresa_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    anulada: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    fecha_anulacion: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    usuario_anulacion_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    motivo_anulacion: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    timestamps: true,
  }
);

export default Inspeccion;