import { DataTypes } from 'sequelize'; 
import {sequelize} from '../../config/database.js';
import Producto from './productoModel.js';

export const Venta = sequelize.define('Venta', {   
  cantidad_total: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  peso_total: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  monto_total:{
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  fecha: {
    type: DataTypes.DATEONLY,
    defaultValue: sequelize.literal('CURRENT_DATE') // Establece la fecha actual por defecto
  }
  // Otros campos de la venta, si los necesitas
},
{
  // timestamps: false, // Evita la creación automática de las columnas 'createdAt' y 'updatedAt'
  freezeTableName: true, // Evita que Sequelize pluralice el nombre de la tabla
});


Venta.hasMany(Producto, {  
  foreignKey: "venta_id",
  sourceKey: "id",
  as:"productos",
  allowNull: true, // Esta opción indica que la relación no es obligatoria
  onDelete: 'SET NULL', // Esta opción establecerá el campo "venta_id" en los registros de productos a nulo al eliminar una orden.
});

Producto.belongsTo(Venta, { 
  foreignKey: "venta_id",
  targetKey: "id",
  allowNull: true, // Esta opción indica que la relación no es obligatoria
  onDelete: 'SET NULL', // Esta opción establecerá el campo "venta_id" en los registros de productos a nulo al eliminar una orden.
});