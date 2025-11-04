// models/documentacion/DocumentoSubcategoria.js
import { DataTypes, Model } from "sequelize";
import { sequelize } from "../../config/database.js";
import DocumentoCategoria from "./DocumentoCategoria.js";

class DocumentoSubcategoria extends Model {}

DocumentoSubcategoria.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

    categoria_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    nombre: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },

    // JSON con array de roles permitidos, ej [1,2,4]
    roles_permitidos: {
      type: DataTypes.JSONB, // si usás Postgres. Si no, DataTypes.JSON
      allowNull: false,
      defaultValue: [],
    },

    activo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: "documento_subcategoria",
    modelName: "DocumentoSubcategoria",
    timestamps: true,
  }
);

// Asociaciones
DocumentoSubcategoria.belongsTo(DocumentoCategoria, {
  foreignKey: "categoria_id",
  as: "categoria",
});
DocumentoCategoria.hasMany(DocumentoSubcategoria, {
  foreignKey: "categoria_id",
  as: "subcategorias",
});

export default DocumentoSubcategoria;
