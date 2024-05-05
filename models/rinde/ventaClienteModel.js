import { DataTypes } from 'sequelize';
import {sequelize} from '../../config/database.js'; // Importa la conexión a la base de datos

const VentaCliente = sequelize.define('VentaCliente', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  cierreventas_id: {
    type: DataTypes.BIGINT,
    allowNull: true,
  },
  fecha: {
    type: DataTypes.DATEONLY,
    defaultValue: sequelize.literal('CURRENT_DATE') // Establece la fecha actual por defecto
  },
  cliente: {
    type: DataTypes.STRING
  },
  monto: {
    type: DataTypes.NUMERIC(12, 3)
  },
  sucursal_id: {
    type: DataTypes.BIGINT
  }
},
{
  timestamps: false, // Evita la creación automática de las columnas 'createdAt' y 'updatedAt'
  freezeTableName: true, // Evita que Sequelize pluralice el nombre de la tabla
});

export default VentaCliente;
