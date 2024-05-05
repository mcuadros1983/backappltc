// detalleCobranzaModel.js

import { DataTypes } from 'sequelize'; 
import { sequelize } from '../../config/database.js';

const DetalleCobranza = sequelize.define('DetalleCobranza', {  
  monto_total: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  fecha: {
    type: DataTypes.DATEONLY,
    defaultValue: sequelize.literal('CURRENT_DATE') // Establece la fecha actual por defecto
  }
  // Otros campos del detalle de cobranza, si los necesitas
},
{
 // timestamps: false, // Evita la creación automática de las columnas 'createdAt' y 'updatedAt'
  freezeTableName: true, // Evita que Sequelize pluralice el nombre de la tabla
});

// Definir relaciones
// Puedes agregar relaciones aquí según tus necesidades

export default DetalleCobranza;
