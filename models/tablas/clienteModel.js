import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";
// import ClienteTabla from "./clienteModel.js";

const ClienteTabla = sequelize.define(
  "Clientetabla",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: false,
    },
    dtype: {
      type: DataTypes.STRING(31),
      allowNull: false,
    },
    // domicilio_id: {
    //   type: DataTypes.INTEGER,
    //   allowNull: true,
    // },
    listaprecio_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    fechaalta: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    fidelizado: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false, // Valor por defecto para fidelizado
    },
  },
  {
    timestamps: false,
    freezeTableName: true,
  }
);


export default ClienteTabla;
