import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const InspeccionPlantilla = sequelize.define(
  "InspeccionPlantilla",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    nombre: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },

    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    version: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },

    activo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },

    empresa_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    timestamps: true,
    freezeTableName: true,
  }
);

export default InspeccionPlantilla;
