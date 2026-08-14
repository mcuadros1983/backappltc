import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const InspeccionCategoria = sequelize.define(
  "InspeccionCategoria",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    plantilla_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    nombre: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },

    orden: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
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

export default InspeccionCategoria;
