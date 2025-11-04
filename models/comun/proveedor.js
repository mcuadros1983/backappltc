import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const Proveedor = sequelize.define("Proveedor", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  direccion: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  telefono: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  cuit: {
    type: DataTypes.STRING,
    allowNull: true, // opcional
  },
  dni: {
    type: DataTypes.STRING,
    allowNull: true, // opcional
  },
  imputacioncontable_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  formapago_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
}, {
  timestamps: false,
  freezeTableName: true,
});

export default Proveedor;
