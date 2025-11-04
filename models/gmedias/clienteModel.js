import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/database.js';
import { Venta } from './ventaModel.js';
import CuentaCorriente from './cuentaCorrienteModel.js';
import Producto from './productoModel.js';

const Cliente = sequelize.define('Cliente', { 
  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  nro_doc: {
    type: DataTypes.STRING,
  },
  telefono: {
    type: DataTypes.STRING,
  },
  email: {
    type: DataTypes.STRING,
  },
  observaciones: {
    type: DataTypes.TEXT,
  },
  margen: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
}, {
  freezeTableName: true,
});

// ✅ Cliente → Venta (alias "ventas")
Cliente.hasMany(Venta, {
  as: 'ventas',
  foreignKey: { name: 'cliente_id', allowNull: true },
  onDelete: 'RESTRICT',
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
  as: "productos",
  allowNull: true, // Esta opción indica que la relación no es obligatoria
});

Producto.belongsTo(Cliente, {
  foreignKey: "cliente_id",
  targetKey: "id",
  allowNull: true, // Esta opción indica que la relación no es obligatoria
});




export default Cliente;