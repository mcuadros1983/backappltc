import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const BotProductMeta = sequelize.define(
  "BotProductMeta",
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    articulo_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
    },
    nombre_visible: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    descripcion_corta: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    platos_recomendados: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
    },
    metodos_coccion: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
    },
    terneza: {
      type: DataTypes.STRING(40),
      allowNull: true,
    },
    rendimiento: {
      type: DataTypes.STRING(40),
      allowNull: true,
    },
    precio_nivel: {
      type: DataTypes.STRING(40),
      allowNull: true,
    },
    recomendacion_comercial: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    alternativas: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
    },
    prioridad: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    activo_bot: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    tags_busqueda: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
    },
    aliases: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
    },
  },
  {
    tableName: "bot_product_meta",
    timestamps: true,
    underscored: true,
  }
);

export default BotProductMeta;