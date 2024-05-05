import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";
// import DetalleVenta from './detalleVentaModel.js';

const ProductoId = sequelize.define("Producto_Id", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false, // Permitir valores nulos
    unique: true, // Asegurar que los valores sean únicos
  }
},
{
  //timestamps: false, // Evita la creación automática de las columnas 'createdAt' y 'updatedAt'
  freezeTableName: true, // Evita que Sequelize pluralice el nombre de la tabla
});

export default ProductoId;
