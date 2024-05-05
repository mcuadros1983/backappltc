import { DataTypes } from 'sequelize';
import { sequelize } from "../../config/database.js";

const TipoIngresoTabla = sequelize.define('Tipoingresotabla', {
  id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: false // Desactiva la auto-generación del id
  },
  descripcion: {
    type: DataTypes.STRING(255),
    allowNull: true
  }
}, {
  timestamps: false,
  freezeTableName: true
});

export default TipoIngresoTabla;
