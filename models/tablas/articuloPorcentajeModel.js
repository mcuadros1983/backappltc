import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";
import ArticuloTabla from "./articuloModel.js";

// Define el modelo para la tabla articuloPrecio
const ArticuloPorcentajetabla = sequelize.define(
  "ArticuloPorcentajetabla",
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    porcentaje: {
      type: DataTypes.NUMERIC(12, 2),
      allowNull: false,
    },
    articulo_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    subcategoria: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
  },
  {
    timestamps: false,
    freezeTableName: true,
  }
);

ArticuloPorcentajetabla.belongsTo(ArticuloTabla, { foreignKey: "articulo_id" });

// En el modelo Articulo
ArticuloTabla.hasMany(ArticuloPorcentajetabla, { foreignKey: "articulo_id" });

export default ArticuloPorcentajetabla;
