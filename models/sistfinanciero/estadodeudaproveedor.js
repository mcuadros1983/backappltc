import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const EstadoDeudaProveedor = sequelize.define("EstadoDeudaProveedor", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  estadoAnterior: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  nuevoEstado: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  fechaCambio: {
    type: DataTypes.DATEONLY,
    defaultValue: DataTypes.NOW,
  },
}, {
  timestamps: false,
  freezeTableName: true,
});

export default EstadoDeudaProveedor;
