import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";
// import Inventario from "./Local_Inventario.js";

const Formula = sequelize.define(
  "formula",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    codigobarraformula: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    articuloformula_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      // primaryKey: true,
    },
    descripcionformula: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    timestamps: false, // Evita la creación automática de las columnas 'createdAt' y 'updatedAt'
    freezeTableName: true, // Evita que Sequelize pluralice el nombre de la tabla
  }
);

export default Formula;
