import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const InspeccionItem = sequelize.define(
  "InspeccionItem",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    categoria_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    descripcion: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    orden: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },

    peso: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },

    criticidad: {
      type: DataTypes.ENUM("BAJA", "MEDIA", "ALTA", "CRITICA"),
      allowNull: false,
      defaultValue: "MEDIA",
    },

    requiere_comentario: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },

    requiere_foto_default: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },

    activo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    timestamps: true,
    freezeTableName: true,
  }
);

export default InspeccionItem;
