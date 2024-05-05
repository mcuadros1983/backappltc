import { DataTypes } from 'sequelize';
import {sequelize} from '../../config/database.js';
// import Cliente from './clienteModel.js';
import DetalleCuentaCorriente from './detalleCuentaCorrienteModel.js'; 
import Cobranza from './cobranzaModel.js';

const CuentaCorriente = sequelize.define('CuentaCorriente', {  
  saldoActual: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0,
  },
  fecha: {
    type: DataTypes.DATEONLY,
    defaultValue: sequelize.literal('CURRENT_DATE') // Establece la fecha actual por defecto
  }
  // Otros campos de la cuenta corriente, si los necesitas
},
{
  //timestamps: false, // Evita la creación automática de las columnas 'createdAt' y 'updatedAt'
  freezeTableName: true, // Evita que Sequelize pluralice el nombre de la tabla
});

CuentaCorriente.hasMany(DetalleCuentaCorriente, { 
  foreignKey: "cuentaCorriente_id",
  sourceKey: "id",
  as:"detalleCuentaCorriente",
  allowNull: true, // Esta opción indica que la relación no es obligatoria
});

DetalleCuentaCorriente.belongsTo(CuentaCorriente, {
  foreignKey: "cuentaCorriente_id",
  targetKey: "id",
  allowNull: true, // Esta opción indica que la relación no es obligatoria
});

CuentaCorriente.hasMany(Cobranza, { 
  foreignKey: "cuentaCorriente_id",
  sourceKey: "id",
  as:"cobranzas",
  allowNull: true, // Esta opción indica que la relación no es obligatoria
});

Cobranza.belongsTo(CuentaCorriente, {
  foreignKey: "cuentaCorriente_id",
  targetKey: "id",
  allowNull: true, // Esta opción indica que la relación no es obligatoria
});

export default CuentaCorriente;