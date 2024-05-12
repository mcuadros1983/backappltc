import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const Cierre = sequelize.define(
  "Cierre",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    fecha: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    sucursal_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    neto: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    iva_21: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    iva_105: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    total: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    nro_cierre: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "cierre",
    timestamps: false, // Evita la creación automática de las columnas 'createdAt' y 'updatedAt'
    freezeTableName: true, // Evita que Sequelize pluralice el nombre de la tabla
  }
);

export default Cierre;
