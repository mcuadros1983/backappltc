import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";
// import SubCategoriaTabla from "./subcategoriaTablaModel.js";
// import SubCategoriaTabla from "./subcategoriaTablaModel.js";

const CategoriaTabla = sequelize.define(
  "Categoriatabla",
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
    // tipoiva_id: {
    //   type: DataTypes.BIGINT,
    // },
  },
  {
    timestamps: false,
    freezeTableName: true,
  }
);

// CategoriaTabla.hasMany(SubCategoriaTabla, { foreignKey: 'categoria_id' });
// SubCategoriaTabla.belongsTo(CategoriaTabla, { foreignKey: 'categoria_id' });

export default CategoriaTabla;
