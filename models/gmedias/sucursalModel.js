import { DataTypes } from 'sequelize';
import {sequelize} from '../../config/database.js';
import Producto from "./productoModel.js";
import Orden from './ordenModel.js';
import { Venta } from "./ventaModel.js";

// "../../config/database.js";

const Sucursal = sequelize.define("Sucursal", {
    id: {
        type: DataTypes.INTEGER, 
        primaryKey: true,
        autoIncrement: false,
    },
    codigo: {
        type: DataTypes.STRING,
    },
    nombre: {
        type: DataTypes.STRING,
    },
    // domicilio_id: {
    //     type: DataTypes.BIGINT,
    //     defaultValue: null
    // }
},
{
  timestamps: false, // Evita la creación automática de las columnas 'createdAt' y 'updatedAt'
  freezeTableName: true, // Evita que Sequelize pluralice el nombre de la tabla
})

Sucursal.hasMany(Venta, { 
    foreignKey: "sucursal_id",
    sourceKey: "id",
    as:"ventas",
    allowNull: true, // Esta opción indica que la relación no es obligatoria
    onDelete: "RESTRICT",
});

Venta.belongsTo(Sucursal, {
    foreignKey: "sucursal_id",
    targetKey: "id",
    allowNull: true, // Esta opción indica que la relación no es obligatoria
    onDelete: "RESTRICT",
});

Sucursal.hasMany(Producto, { 
    foreignKey: "sucursal_id",
    as:"productos",
    sourceKey: "id",
    allowNull: true, // Esta opción indica que la relación no es obligatoria
    onDelete: 'SET NULL', // Esta opción establecerá el campo "sucursal_id" en los registros de productos a nulo al eliminar una orden.
});

Producto.belongsTo(Sucursal, { 
    foreignKey: "sucursal_id",
    targetKey: "id",
    allowNull: true, // Esta opción indica que la relación no es obligatoria
    onDelete: 'SET NULL', // Esta opción establecerá el campo "sucursal_id" en los registros de productos a nulo al eliminar una orden.
});

Sucursal.hasMany(Orden, { 
    foreignKey: "sucursal_id",
    sourceKey: "id",
    as:"ordenes",
    allowNull: true, // Esta opción indica que la relación no es obligatoria
    onDelete: 'SET NULL', // Esta opción establecerá el campo "sucursal_id" en los registros de productos a nulo al eliminar una orden.
});

Orden.belongsTo(Sucursal, {
    foreignKey: "sucursal_id",
    targetKey: "id",
    allowNull: true, // Esta opción indica que la relación no es obligatoria
    onDelete: 'SET NULL', // Esta opción establecerá el campo "sucursal_id" en los registros de productos a nulo al eliminar una orden.
});

export default Sucursal;