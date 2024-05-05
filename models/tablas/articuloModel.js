import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const ArticuloTabla = sequelize.define(
  "Articulotabla",
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: false, // Desactiva la auto-generación del id
    },
    codigobarra: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    descripcion: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    descripcionreducida: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    subcategoria_id: {
      type: DataTypes.BIGINT,
    },
    unidadmedida_id: {
      type: DataTypes.BIGINT,
    },
  },
  {
    timestamps: false,
    freezeTableName: true,
  }
);

export default ArticuloTabla;
