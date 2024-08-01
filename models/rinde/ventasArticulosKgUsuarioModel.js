import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/database.js'; // Importa la conexión a la base de datos

const VentasArticulosKgPorUsuario = sequelize.define('VentasArticulosKgPorUsuario', {
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
  usuario_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  articulocodigo: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  total_cantidadpeso: {
    type: DataTypes.NUMERIC(12, 3),
    allowNull: false,
  },
},
{
  timestamps: false, // Evita la creación automática de las columnas 'createdAt' y 'updatedAt'
  freezeTableName: true, // Evita que Sequelize pluralice el nombre de la tabla
});

export default VentasArticulosKgPorUsuario;