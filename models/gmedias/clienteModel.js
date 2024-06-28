import { DataTypes } from 'sequelize'; 
import {sequelize} from '../../config/database.js';
import { Venta } from './ventaModel.js';
import CuentaCorriente from './cuentaCorrienteModel.js';
import Producto from './productoModel.js';

const Cliente = sequelize.define('Cliente', {
  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  margen: {
    type: DataTypes.FLOAT,
    defaultValue: 0, // Valor predeterminado para margen
  },
  // Otros campos del cliente
},
{
  // timestamps: false, // Evita la creación automática de las columnas 'createdAt' y 'updatedAt'
  freezeTableName: true, // Evita que Sequelize pluralice el nombre de la tabla
});

Cliente.hasMany(Venta, {   
  foreignKey: "cliente_id",
  sourceKey: "id",
  as:"ventas",
  allowNull: true, // Esta opción indica que la relación no es obligatoria
  onDelete: "RESTRICT",
});

Venta.belongsTo(Cliente, {
  foreignKey: "cliente_id",
  targetKey: "id",
  allowNull: true, // Esta opción indica que la relación no es obligatoria
  onDelete: "RESTRICT", // Restringe la eliminación si hay ventas asociadas
});

// Relación de uno a uno con Cliente
Cliente.hasOne(CuentaCorriente, {
  foreignKey: 'cliente_id',
  sourceKey: 'id',
  as: 'cuentaCorriente',
  allowNull: true,
  onDelete: "RESTRICT",
});

CuentaCorriente.belongsTo(Cliente, {
  foreignKey: 'cliente_id',
  targetKey: 'id',
  allowNull: true,
  onDelete: "RESTRICT",
});

Cliente.hasMany(Producto, { 
  foreignKey: "cliente_id",
  sourceKey: "id",
  as:"productos",
  allowNull: true, // Esta opción indica que la relación no es obligatoria
});

Producto.belongsTo(Cliente, {
  foreignKey: "cliente_id",
  targetKey: "id",
  allowNull: true, // Esta opción indica que la relación no es obligatoria
});




export default Cliente;