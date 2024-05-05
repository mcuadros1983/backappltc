import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";
import ClienteTabla from "./clienteModel.js";

const ClientePersonaTabla = sequelize.define(
  "ClientePersonatabla",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: false,
    },
    apellido: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    cuil: {
      type: DataTypes.STRING, // 11 caracteres para CUIL
      allowNull: true,
    },
    fechanacimiento: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    nombre: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    sexo: {
      type: DataTypes.STRING, // M o F
      allowNull: true,
    },
    numero: {
      type: DataTypes.STRING, // Ajusta según el tipo de número de identificación
      allowNull: false,
    },
    // tipodocumento_id: {
    //   type: DataTypes.BIGINT,
    //   allowNull: true,
    // },
  },
  {
    timestamps: false,
    freezeTableName: true,
  }
);

ClientePersonaTabla.belongsTo(ClienteTabla, {
  foreignKey: "id",
});

export default ClientePersonaTabla;
