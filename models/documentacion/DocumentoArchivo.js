// models/documentacion/DocumentoArchivo.js
import { DataTypes, Model } from "sequelize";
import { sequelize } from "../../config/database.js";

class DocumentoArchivo extends Model { }

DocumentoArchivo.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

    documento_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    filename_original: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },

    mime_type: {
      type: DataTypes.STRING(120),
      allowNull: true,
    },

    url_storage: {
      // ej: https://wasabi/bucket/... o ruta interna
      type: DataTypes.TEXT,
      allowNull: false,
    },

    es_obligatorio_leer: {
      // ej reglamento interno, higiene/seguridad
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },

    orden: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    drive_file_id: {
      type: DataTypes.STRING,
      allowNull: true,
    }
  },
  {
    sequelize,
    modelName: "DocumentoArchivo",
    tableName: "documento_archivo",
    timestamps: false,
    freezeTableName: true,
  }
);

export default DocumentoArchivo;
