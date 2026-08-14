import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const GestionTareaArchivo = sequelize.define(
  "GestionTareaArchivo",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    tarea_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    nombre_original: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    mime_type: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    drive_file_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    drive_url: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    activo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    tableName: "gestion_tarea_archivos",
    underscored: true,
  }
);

export default GestionTareaArchivo;