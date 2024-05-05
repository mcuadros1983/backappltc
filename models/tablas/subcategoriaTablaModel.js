import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const SubcategoriaTabla = sequelize.define(
  "SubcategoriaTabla",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: false, // Desactiva la auto-generación del id
    },
    descripcion: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    categoria_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
  },
  {
    timestamps: false,
    freezeTableName: true,
  }
);


export default SubcategoriaTabla;
