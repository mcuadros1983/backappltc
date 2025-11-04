import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const TarjetaComun = sequelize.define("TarjetaComun", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  terminacion: {
    type: DataTypes.STRING(4),
    allowNull: false,
    validate: {
      isNumeric: true,
      len: [4, 4],
    },
  },
  tipotarjeta_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  marca_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  empresa_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  banco_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  fecha_cierre: {
    type: DataTypes.DATEONLY,
    allowNull: true, // o false si es obligatorio
  },
}, {
  timestamps: false,
  freezeTableName: true,
});

export default TarjetaComun;
