import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const InspeccionEvidencia = sequelize.define(
  "InspeccionEvidencia",
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

    archivo: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },

    comentario: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    drive_file_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    web_content_link: {
      type: DataTypes.STRING(1000),
      allowNull: true,
    },
  },
  {
    timestamps: true,
  }
);

export default InspeccionEvidencia;