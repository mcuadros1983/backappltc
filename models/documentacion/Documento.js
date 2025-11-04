// models/documentacion/Documento.js
import { DataTypes, Model } from "sequelize";
import { sequelize } from "../../config/database.js";
// import DocumentoSubcategoria from "./DocumentoSubcategoria.js";

class Documento extends Model {}

Documento.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

    titulo: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },

    descripcion_resumen: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    // ej: "PROCESO", "MANUAL", "COMUNICACION", "CAPACITACION"
    tipo: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },

    // --- NUEVO ---
    subcategoria_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    // (legacy / compat) estos ya existen en tu código original:
    visibilidad: {
      type: DataTypes.STRING(50), // PUBLICO | SOLO_ADMIN | ROL_ESPECIFICO
      allowNull: true,
    },
    rol_destino_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    sucursal_id_aplica: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    contenido: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    vigente_desde: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    vigente_hasta: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    version: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },

    publicado_en: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    creado_por_usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    actualizado_por_usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    activo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: "documento",
    modelName: "Documento",
    timestamps: true,
  }
);

export default Documento;
