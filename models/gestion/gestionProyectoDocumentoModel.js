import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const GestionProyectoDocumento = sequelize.define(
  "GestionProyectoDocumento",
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

    documento_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "gestion_proyecto_documentos",
    underscored: true,
  }
);

export default GestionProyectoDocumento;