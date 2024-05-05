import { DataTypes } from 'sequelize';
import {sequelize} from '../../config/database.js'; // Importa la conexión a la base de datos

const VentaTotal = sequelize.define('VentaTotal', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  fecha: {
    type: DataTypes.DATEONLY,
    defaultValue: sequelize.literal('CURRENT_DATE') // Establece la fecha actual por defecto
  },
  monto: {
    type: DataTypes.NUMERIC(12, 3)
  },
  cierreventa_id: {
    type: DataTypes.BIGINT,
    allowNull:true,

  },
  sucursal_id: {
    type: DataTypes.BIGINT,
    defaultValue: 18
  }
},
{
  timestamps: false, // Evita la creación automática de las columnas 'createdAt' y 'updatedAt'
  freezeTableName: true, // Evita que Sequelize pluralice el nombre de la tabla
});

export default VentaTotal;