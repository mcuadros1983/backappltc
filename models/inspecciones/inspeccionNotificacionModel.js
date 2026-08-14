import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const InspeccionNotificacion = sequelize.define(
  "InspeccionNotificacion",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    inspeccion_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    respuesta_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    usuario_destino_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    sucursal_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    titulo: {
      type: DataTypes.STRING(250),
      allowNull: false,
    },

    mensaje: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    tipo: {
      type: DataTypes.ENUM(
        "OBSERVACION_NUEVA",
        "REVISION_SOLICITADA",
        "APROBADA",
        "RECHAZADA",
        "REABIERTA",
        "VENCIDA"
      ),
      allowNull: false,
    },

    leida: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    fecha_lectura: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    timestamps: true,
  }
);

export default InspeccionNotificacion;