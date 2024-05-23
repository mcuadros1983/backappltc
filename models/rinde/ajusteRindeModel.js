import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";
import Rinde from "./rindeModel.js";
// import ClienteTabla from "../tablas/clienteModel.js";

const AjusteRinde = sequelize.define(
  "AjusteRinde",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    rinde_id: {
      type: DataTypes.BIGINT,
    },
    descripcion: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    importe: {
      type: DataTypes.DECIMAL(12, 3),
      allowNull: false,
    },
    // fecha: {
    //   type: DataTypes.DATEONLY,
    //   allowNull: true,
    // },
  },
  {
    timestamps: false,
    freezeTableName: true,
  }
);

AjusteRinde.belongsTo(Rinde, {
  foreignKey: "rinde_id",
});

export default AjusteRinde;
