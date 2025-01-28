import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";
import Producto from "./productoModel.js";

const Ingreso = sequelize.define("IngresoMedias", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  cantidad_total: {
    type: DataTypes.INTEGER,
  },
  peso_total: {
    type: DataTypes.DECIMAL,
  },
  categoria_ingreso: {
    type: DataTypes.STRING,
  },
  fecha: {
    type: DataTypes.DATEONLY,
    defaultValue: sequelize.literal('CURRENT_DATE') // Establece la fecha actual por defecto
  }
},
{
  // timestamps: false, // Evita la creación automática de las columnas 'createdAt' y 'updatedAt'
  freezeTableName: true, // Evita que Sequelize pluralice el nombre de la tabla
});

Ingreso.hasMany(Producto, {
  foreignKey: "ingreso_id",
  sourceKey: "id",
  allowNull: true, // Esta opción indica que la relación no es obligatoria
  onDelete: 'SET NULL', // Cambiar "CASCADE" a "SET NULL"
  // onDelete:"CASCADE"
  // onDelete: "SET NULL", // Esta opción establecerá el campo "ingreso_id" en los registros de productos a nulo al eliminar un ingreso.
});

Producto.belongsTo(Ingreso, {
  foreignKey: "ingreso_id",
  targetKey: "id",
  allowNull: true, // Esta opción indica que la relación no es obligatoria
});

export default Ingreso;
