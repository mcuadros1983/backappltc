// models/documentacion/DocumentoCategoria.js
import { DataTypes, Model } from "sequelize";
import { sequelize } from "../../config/database.js";

class DocumentoCategoria extends Model {}

DocumentoCategoria.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

    nombre: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },

    activo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },

    creado_por_usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "documento_categoria",
    modelName: "DocumentoCategoria",
    timestamps: true,
  }
);

export default DocumentoCategoria;
