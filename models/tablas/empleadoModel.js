import { DataTypes } from 'sequelize';
import { sequelize } from "../../config/database.js";

const EmpleadoTabla = sequelize.define('Empleadotabla', {
  id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: false // Desactiva la auto-generación del id
  },
  apellido: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  cuil: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  fechanacimiento: {
    type: DataTypes.DATE,
    allowNull: true
  },
  nombre: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  sexo: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  numero: {
    type: DataTypes.STRING(255),
    allowNull: true
  }
}, {
  timestamps: false,
  freezeTableName: true
});

export default EmpleadoTabla;
