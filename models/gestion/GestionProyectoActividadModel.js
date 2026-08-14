import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const GestionProyectoActividad = sequelize.define(
  "GestionProyectoActividad",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    proyecto_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    tipo: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },

    comentario: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
  },
  {
    tableName: "gestion_proyecto_actividades",
    underscored: true,
  }
);

export default GestionProyectoActividad;