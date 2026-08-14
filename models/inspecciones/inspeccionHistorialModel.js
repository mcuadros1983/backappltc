import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const InspeccionHistorial = sequelize.define(
  "InspeccionHistorial",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    respuesta_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    accion: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    estado_anterior: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },

    estado_nuevo: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },

    comentario: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    timestamps: true,
  }
);

export default InspeccionHistorial;