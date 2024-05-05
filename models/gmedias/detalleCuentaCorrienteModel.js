import { DataTypes } from 'sequelize';
import {sequelize} from '../../config/database.js';


const DetalleCuentaCorriente = sequelize.define('DetalleCuentaCorriente', {  
  monto: {
    type: DataTypes.FLOAT,
    allowNull: false,
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

export default DetalleCuentaCorriente;